import base64
import io
import os
import time
from collections import Counter
import tempfile
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

try:
    import mediapipe as mp
    try:
        mp_face_detection = mp.solutions.face_detection
    except AttributeError:
        from mediapipe.python.solutions import face_detection as mp_face_detection
    MEDIAPIPE_AVAILABLE = True
except Exception as e:
    print(f"Warning: Mediapipe face detection not available ({e})")
    MEDIAPIPE_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torchvision import transforms, models

    MASK_DIM = 256
    class TightHybridGA(nn.Module):
        def __init__(self, num_classes=7, mixer_depth=4, num_heads=4, mlp_dim=256, dropout=0.3):
            super().__init__()
            self.mixer_depth = mixer_depth
            self.patch_size = 4
            backbone = models.resnet18(weights=None)
            self.backbone_frozen = nn.Sequential(
                backbone.conv1, backbone.bn1, backbone.relu, backbone.maxpool,
                backbone.layer1, backbone.layer2,
            )
            self.backbone_tune = backbone.layer3
            dim = MASK_DIM

            self.ga_mask = nn.Parameter(torch.zeros(dim))
            self.depthwise_convs = nn.ModuleList([nn.Conv2d(dim, dim, 3, groups=dim, padding=1) for _ in range(mixer_depth)])
            self.batch_norms_dw = nn.ModuleList([nn.BatchNorm2d(dim) for _ in range(mixer_depth)])
            self.pointwise_convs = nn.ModuleList([nn.Conv2d(dim, dim, kernel_size=1) for _ in range(mixer_depth)])
            self.batch_norms_pw = nn.ModuleList([nn.BatchNorm2d(dim) for _ in range(mixer_depth)])
            self.gelu = nn.GELU()
            self.feature_align = nn.AdaptiveAvgPool2d((16, 16))
            self.patch_embed = nn.Conv2d(dim, dim, kernel_size=self.patch_size, stride=self.patch_size)

            encoder_layer = nn.TransformerEncoderLayer(
                d_model=dim, nhead=num_heads, dim_feedforward=mlp_dim,
                dropout=dropout, activation='gelu', batch_first=True
            )
            self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=2)
            self.gap = nn.AdaptiveAvgPool1d(1)
            self.head_dropout = nn.Dropout(dropout)
            self.mlp_head = nn.Linear(dim, num_classes)

        def forward(self, x):
            x = self.backbone_frozen(x)
            x = self.backbone_tune(x)
            soft_mask = torch.sigmoid(self.ga_mask)
            x = x * soft_mask.view(1, -1, 1, 1)
            for i in range(self.mixer_depth):
                residual = x
                x = self.depthwise_convs[i](x)
                x = self.gelu(x)
                x = self.batch_norms_dw[i](x)
                x = x + residual
                x = self.pointwise_convs[i](x)
                x = self.gelu(x)
                x = self.batch_norms_pw[i](x)
            x = self.feature_align(x)
            x = self.patch_embed(x)
            x = x.flatten(2).transpose(1, 2)
            x = self.transformer_encoder(x)
            x = x.transpose(1, 2)
            x = self.gap(x).squeeze(-1)
            x = self.head_dropout(x)
            return self.mlp_head(x)

    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    MODELS = []
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    if os.path.isdir(models_dir):
        for i in range(1, 27):
            model_path = os.path.join(models_dir, f"best_model_fold_{i}.pth")
            if os.path.exists(model_path) and os.path.getsize(model_path) > 1000:
                model = TightHybridGA(num_classes=7).to(DEVICE)
                try:
                    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
                    model.eval()
                    MODELS.append(model)
                except Exception as e:
                    print(f"Failed to load {model_path}: {e}")

    USE_REAL_MODEL = len(MODELS) > 0

    EVAL_TRANSFORM = transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    TORCH_AVAILABLE = True

except ImportError:
    TORCH_AVAILABLE = False
    USE_REAL_MODEL = False


CATEGORIES = ['disgust', 'fear', 'happiness', 'others', 'repression', 'sadness', 'surprise']
TEMPERATURE = 2.0

sessions: dict[str, dict] = {}

app = FastAPI(title="CogniTrack Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _compute_engagement(probs: list[float]) -> dict:
    p = probs
    vp = p[2] + p[6]
    vn = p[3]
    vd = p[0] + p[1] + p[4] + p[5]

    def tri(v):
        low = max(0.0, (0.5 - v) / 0.5) if v <= 0.5 else 0.0
        mid = max(0.0, min(v / 0.5, (1.0 - v) / 0.5))
        high = max(0.0, (v - 0.5) / 0.5) if v >= 0.5 else 0.0
        return low, mid, high

    vp_l, vp_m, vp_h = tri(vp)
    vn_l, vn_m, vn_h = tri(vn)
    vd_l, vd_m, vd_h = tri(vd)

    w1 = min(vp_h, vd_l)
    w2 = min(vn_h, vp_l, vd_l)
    w3 = vd_h
    w4 = min(vp_m, vn_m)
    w5 = min(vp_m, vd_m)
    w6 = min(vn_m, vd_m)

    total_w = w1 + w2 + w3 + w4 + w5 + w6
    score = (
        (w1 * 90.0) + (w2 * 60.0) + (w3 * 25.0) +
        (w4 * 70.0) + (w5 * 50.0) + (w6 * 40.0)
    ) / total_w if total_w > 0 else 50.0

    return {
        "score": round(score, 1),
        "positive": round(vp * 100, 1),
        "neutral": round(vn * 100, 1),
        "negative": round(vd * 100, 1),
    }


def _mock_probs() -> list[float]:
    raw = np.random.dirichlet([0.5, 0.3, 2.5, 1.5, 0.3, 0.4, 2.0])
    return raw.tolist()

def _crop_face(image):
    if not MEDIAPIPE_AVAILABLE:
        return image
    with mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detection:
        results = face_detection.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        if not results.detections:
            return image
        bbox = results.detections[0].location_data.relative_bounding_box
        h, w, _ = image.shape
        x = max(0, int(bbox.xmin * w))
        y = max(0, int(bbox.ymin * h))
        width = int(bbox.width * w)
        height = int(bbox.height * h)
        return image[y:y+height, x:x+width]


def compute_optical_flow(onset_bgr, apex_bgr):
    g1 = cv2.cvtColor(onset_bgr, cv2.COLOR_BGR2GRAY)
    g2 = cv2.cvtColor(apex_bgr, cv2.COLOR_BGR2GRAY)
    flow = cv2.calcOpticalFlowFarneback(
        g1, g2, None,
        pyr_scale=0.5, levels=3, winsize=15,
        iterations=3, poly_n=5, poly_sigma=1.2, flags=0
    )
    fx, fy = flow[..., 0], flow[..., 1]
    mag = np.sqrt(fx ** 2 + fy ** 2)

    def to_uint8(ch):
        return cv2.normalize(ch, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    return np.stack([to_uint8(fx), to_uint8(fy), to_uint8(mag)], axis=-1)

def process_video_segment(video_bytes: bytes) -> dict:
    if not (USE_REAL_MODEL and TORCH_AVAILABLE):
        probs = _mock_probs()
        pred_idx = int(np.argmax(probs))
        return {
            "emotion": CATEGORIES[pred_idx],
            "probs": {cat: round(p * 100, 1) for cat, p in zip(CATEGORIES, probs)},
            "engagement": _compute_engagement(probs),
        }

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tf:
        tf.write(video_bytes)
        tf_name = tf.name

    cap = cv2.VideoCapture(tf_name)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()
    os.remove(tf_name)

    if len(frames) < 2:
        probs = _mock_probs()
        pred_idx = int(np.argmax(probs))
        return {
            "emotion": CATEGORIES[pred_idx],
            "probs": {cat: round(p * 100, 1) for cat, p in zip(CATEGORIES, probs)},
            "engagement": _compute_engagement(probs),
        }

    cropped_frames = [_crop_face(f) for f in frames]
    gray_frames = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in cropped_frames]

    
    motions = []
    for i in range(1, len(gray_frames)):
        diff = cv2.absdiff(gray_frames[i], gray_frames[i-1])
        motions.append(np.sum(diff))
    
    if np.max(motions) < 1000:
        onset_idx = 0
        apex_idx = len(frames) - 1
    else:
        apex_idx = int(np.argmax(motions)) + 1
        onset_idx = 0
        if apex_idx > 0:
            onset_idx = int(np.argmin(motions[:apex_idx]))
    
    onset_img = cropped_frames[onset_idx]
    apex_img = cropped_frames[apex_idx]

    if onset_img.shape != apex_img.shape:
        apex_img = cv2.resize(apex_img, (onset_img.shape[1], onset_img.shape[0]))

    flow_img = compute_optical_flow(onset_img, apex_img)

    tensor = EVAL_TRANSFORM(flow_img).unsqueeze(0).to(DEVICE)
    
    ensemble_probs = []
    with torch.no_grad():
        for model in MODELS:
            logits = model(tensor)
            probs = F.softmax(logits / TEMPERATURE, dim=1)[0].cpu().tolist()
            ensemble_probs.append(probs)
    
    avg_probs = np.mean(ensemble_probs, axis=0).tolist()
    pred_idx = int(np.argmax(avg_probs))

    emotion = CATEGORIES[pred_idx]
    engagement = _compute_engagement(avg_probs)

    return {
        "emotion": emotion,
        "probs": {cat: round(p * 100, 1) for cat, p in zip(CATEGORIES, avg_probs)},
        "engagement": engagement,
    }


def _get_or_create_session(session_id: str) -> dict:
    if session_id not in sessions:
        sessions[session_id] = {
            "history": [],
            "started_at": time.time(),
        }
    return sessions[session_id]

from pydantic import BaseModel
class SessionSummaryRequest(BaseModel):
    session_id: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "ensemble" if USE_REAL_MODEL else "mock",
        "torch": TORCH_AVAILABLE,
        "mediapipe": MEDIAPIPE_AVAILABLE,
        "loaded_models": len(MODELS) if USE_REAL_MODEL else 0
    }


@app.post("/analyze")
async def analyze(session_id: str = Form(...), video: UploadFile = File(...)):
    video_bytes = await video.read()
    result = process_video_segment(video_bytes)
    session = _get_or_create_session(session_id)
    session["history"].append({"ts": time.time(), **result})
    return result


@app.post("/session/summary")
def session_summary(req: SessionSummaryRequest):
    session = sessions.get(req.session_id)
    if not session or not session["history"]:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    history = session["history"]
    scores = [h["engagement"]["score"] for h in history]
    emotions = [h["emotion"] for h in history]

    avg_score = round(sum(scores) / len(scores), 1)
    peak_score = round(max(scores), 1)
    duration_s = round(history[-1]["ts"] - history[0]["ts"])

    emotion_counts = Counter(emotions)
    dominant_emotion = emotion_counts.most_common(1)[0][0]
    emotion_dist = {e: round(c / len(emotions) * 100, 1) for e, c in emotion_counts.items()}

    step = max(1, len(scores) // 60)
    timeline = [{"t": i, "score": scores[i]} for i in range(0, len(scores), step)]

    avg_positive = round(sum(h["engagement"]["positive"] for h in history) / len(history), 1)
    avg_neutral = round(sum(h["engagement"]["neutral"] for h in history) / len(history), 1)
    avg_negative = round(sum(h["engagement"]["negative"] for h in history) / len(history), 1)

    del sessions[req.session_id]

    return {
        "avg_engagement": avg_score,
        "peak_engagement": peak_score,
        "duration_seconds": duration_s,
        "dominant_emotion": dominant_emotion,
        "emotion_distribution": emotion_dist,
        "engagement_timeline": timeline,
        "avg_positive": avg_positive,
        "avg_neutral": avg_neutral,
        "avg_negative": avg_negative,
        "sample_count": len(history),
    }
