# CogniTrack AI — Setup Guide

## Struktur Folder

```
Softcomp/
├── backend/
│   ├── main.py             # FastAPI server
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── globals.css
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── watch/page.tsx    # Video + dashboard
│   │   │   └── summary/page.tsx  # Post-session summary
│   │   ├── components/
│   │   │   ├── EngagementRing.tsx
│   │   │   └── EmotionBadge.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── models/
│   └── best_model_overall.pth   # (dari Git LFS / training)
└── App.ipynb
```

---

## 1. Backend (FastAPI)

### Install dependencies

```bash
cd backend

# Buat virtual environment (opsional tapi direkomendasikan)
python -m venv venv
venv\Scripts\activate     # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
```

### Untuk real model inference (butuh PyTorch)

```bash
# Install PyTorch sesuai hardware kamu:
# CPU only:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# GPU (CUDA 12.1):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

Pastikan file `models/best_model_overall.pth` ada di root project (satu level di atas `backend/`).

### Jalankan server

```bash
uvicorn main:app --reload --port 8000
```

Backend berjalan di: http://localhost:8000  
Docs API: http://localhost:8000/docs

> Jika model `.pth` tidak ditemukan atau PyTorch tidak terinstall, backend otomatis pakai **mock mode** — data dummy realistis dikembalikan supaya UI tetap bisa jalan.

---

## 2. Frontend (Next.js)

### Install dependencies

```bash
cd frontend
npm install
```

### Jalankan dev server

```bash
npm run dev
```

Frontend berjalan di: http://localhost:3000

---

## 3. Alur Penggunaan

1. Buka http://localhost:3000 → **Landing Page**
2. Klik **Start Session** → masuk ke `/watch`
3. Paste URL YouTube → klik **Analyze** → video embed muncul
4. Klik **Enable Camera** → izinkan akses kamera browser
5. Klik **Start Session** → tracking dimulai (setiap ~4 detik webcam di-capture)
6. Nonton video, lihat engagement score di panel kanan update real-time
7. Klik **End & Get Summary** → redirect ke `/summary` dengan full analytics

---

## 4. Catatan Penting

| Topik | Detail |
|-------|--------|
| YouTube embed | Video diputar via `<iframe>` — CORS/DRM tidak mengizinkan akses frame video, jadi webcam user yang dianalisis |
| Webcam capture | `getUserMedia` → frame 224×224 JPEG di-capture tiap 4 detik |
| Inference | Base64 JPEG → POST `/analyze` → emotion + engagement score |
| Session state | Disimpan in-memory di backend; di-clear saat `/session/summary` dipanggil |
| Mock mode | Backend auto-fallback ke dummy data jika model tidak ditemukan |

---

## 5. Troubleshooting

**Camera tidak muncul di panel kanan (large feed)?**  
Panel kanan menggunakan `srcObject` ref langsung. Jika tidak muncul, video kecil di bawah tetap berjalan dan capture tetap berfungsi.

**CORS error?**  
Pastikan backend berjalan di port 8000 dan frontend di port 3000.

**Model file tidak ditemukan?**  
Backend fallback ke mock. Untuk load model asli: download dari Git LFS dengan `git lfs pull` lalu pastikan ada di `models/best_model_overall.pth`.
