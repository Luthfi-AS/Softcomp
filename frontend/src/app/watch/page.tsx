"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Camera,
  CameraOff,
  Play,
  Square,
  AlertCircle,
  ChevronRight,
  Activity,
  Zap,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { analyzeSegment, AnalyzeResult } from "@/lib/api";
import EngagementRing from "@/components/EngagementRing";
import EmotionBadge from "@/components/EmotionBadge";

function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    let videoId = "";
    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (url.hostname.includes("youtube.com")) {
      videoId = url.searchParams.get("v") ?? "";
    }
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  } catch {
    return null;
  }
}

interface StreamEvent {
  id: string;
  text: string;
  age: string;
}

function relativeTime(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 5) return "Just Now";
  if (s < 60) return `-${s}s`;
  return `-${Math.round(s / 60)}m`;
}

export default function WatchPage() {
  const router = useRouter();

  const [inputUrl, setInputUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");

  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "active" | "denied">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [sessionId] = useState(() => uuidv4());
  const [sessionActive, setSessionActive] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const eventTimesRef = useRef<number[]>([]);

  const requestCamera = useCallback(async () => {
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
    } catch {
      setCameraState("denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("idle");
  }, []);

  const startSession = useCallback(() => {
    if (cameraState !== "active" || !streamRef.current) return;
    setSessionActive(true);

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(streamRef.current);
    } catch (e) {
      console.error("MediaRecorder init failed", e);
      return;
    }
    
    recorder.ondataavailable = async (e) => {
      if (e.data && e.data.size > 0) {
        try {
          const r = await analyzeSegment(sessionId, e.data);
          setResult(r);

          const now = Date.now();
          eventTimesRef.current.push(now);

          setEvents((prev) => {
            const next: StreamEvent[] = [
              {
                id: uuidv4(),
                text: `Emotion detected: ${r.emotion}`,
                age: relativeTime(0),
              },
              ...prev.map((ev, i) => ({
                ...ev,
                age: relativeTime(Date.now() - (eventTimesRef.current[eventTimesRef.current.length - 2 - i] ?? Date.now())),
              })),
            ].slice(0, 6);
            return next;
          });
        } catch {
          // silent
        }
      }
    };

    recorder.start(4000); // Record chunks of 4 seconds
    mediaRecorderRef.current = recorder;
  }, [cameraState, sessionId]);

  const stopSession = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setSessionActive(false);
    stopCamera();
    router.push("/");
  }, [router, stopCamera]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleAnalyze = () => {
    const embed = toEmbedUrl(inputUrl.trim());
    if (!embed) {
      setUrlError("Please enter a valid YouTube URL");
      return;
    }
    setUrlError("");
    setEmbedUrl(embed);
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col">
      <header className="border-b border-brand-border flex items-center px-6 h-14 gap-4 shrink-0">
        <button onClick={() => router.push("/")} className="flex items-center gap-2 mr-4">
          <Brain className="w-5 h-5 text-brand-green" />
          <span className="font-bold text-sm hidden sm:block">CogniTrack</span>
        </button>

        <div className="flex-1 flex items-center gap-3 max-w-2xl">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => { setInputUrl(e.target.value); setUrlError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Paste YouTube link (e.g. https://youtube.com/watch?v=...)"
              className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-2 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green/50 transition-colors"
            />
            {urlError && (
              <p className="absolute -bottom-5 left-0 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {urlError}
              </p>
            )}
          </div>
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 bg-brand-green text-brand-dark font-semibold text-sm px-4 py-2 rounded-lg shrink-0"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Analyze</span>
          </button>
        </div>

        {sessionActive && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-brand-green border border-brand-green/20 rounded-full px-3 py-1 bg-brand-green/5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            Live Monitoring Active
          </span>
        )}
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 overflow-hidden">
        <div className="flex flex-col p-5 gap-5 overflow-auto">
          <div className="card overflow-hidden relative">
            {embedUrl ? (
              <div className="relative aspect-video">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-xs text-brand-green bg-brand-dark/80 backdrop-blur-sm px-2 py-1 rounded">
                  <Activity className="w-3 h-3" />
                  Subject Tracking: Locked
                </div>
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-brand-muted gap-4 bg-[#0D1918]">
                <Play className="w-16 h-16 text-brand-green/20" />
                <div className="text-center">
                  <p className="font-medium text-white mb-1">Paste a YouTube URL above</p>
                  <p className="text-sm">The video will play here while CogniTrack analyzes your engagement</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Webcam — Viewer</h3>
                <p className="text-xs text-brand-muted">Your face is analyzed every ~4 seconds</p>
              </div>
              <div className="flex items-center gap-2">
                {cameraState === "active" && !sessionActive && (
                  <button
                    onClick={startSession}
                    disabled={!embedUrl}
                    className="flex items-center gap-2 bg-brand-green text-brand-dark font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    Start Session
                  </button>
                )}
                {sessionActive && (
                  <button
                    onClick={stopSession}
                    className="flex items-center gap-2 bg-red-500/80 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    End Session
                  </button>
                )}
                {cameraState === "active" && (
                  <button onClick={stopCamera} className="p-2 rounded-lg border border-brand-border hover:border-red-500/50 transition-colors">
                    <CameraOff className="w-4 h-4 text-brand-muted" />
                  </button>
                )}
              </div>
            </div>

            {cameraState === "idle" && (
              <div className="flex flex-col items-center justify-center py-10 gap-4 border border-dashed border-brand-border rounded-xl bg-brand-dark/40">
                <Camera className="w-12 h-12 text-brand-muted" />
                <div className="text-center">
                  <p className="font-medium mb-1">Camera access required</p>
                  <p className="text-sm text-brand-muted mb-4">CogniTrack needs your webcam to analyze engagement</p>
                </div>
                <button
                  onClick={requestCamera}
                  className="flex items-center gap-2 bg-brand-green text-brand-dark font-semibold px-6 py-2.5 rounded-xl"
                >
                  <Camera className="w-4 h-4" />
                  Enable Camera
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {cameraState === "requesting" && (
              <div className="flex items-center justify-center py-10 gap-3 text-brand-muted">
                <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                Requesting camera access...
              </div>
            )}

            {cameraState === "denied" && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 border border-red-500/20 rounded-xl bg-red-500/5">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-300 text-center">
                  Camera access denied. Please allow camera access in your browser settings and reload.
                </p>
                <button onClick={requestCamera} className="text-sm text-brand-green underline">
                  Try again
                </button>
              </div>
            )}

            {cameraState === "active" && (
              <div className="flex gap-4 items-start">
                <div className="relative shrink-0">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-48 h-36 object-cover rounded-lg border border-brand-border"
                  />
                  {sessionActive && (
                    <div className="absolute inset-0 rounded-lg border-2 border-brand-green ring-pulse pointer-events-none" />
                  )}
                  <span className="absolute top-1.5 left-1.5 text-xs bg-brand-dark/80 text-brand-green px-1.5 py-0.5 rounded font-medium">
                    USER CAM
                  </span>
                  {sessionActive && (
                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-xs bg-brand-dark/80 text-red-400 px-1.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      REC
                    </span>
                  )}
                </div>

                {!sessionActive && !embedUrl && (
                  <div className="text-sm text-brand-muted flex items-start gap-2 pt-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-500" />
                    Paste a YouTube URL above and click Analyze to enable the Start Session button.
                  </div>
                )}
                {!sessionActive && embedUrl && (
                  <div className="text-sm text-brand-muted flex items-start gap-2 pt-2">
                    <Zap className="w-4 h-4 shrink-0 mt-0.5 text-brand-green" />
                    Camera ready. Click <strong className="text-white">Start Session</strong> to begin tracking.
                  </div>
                )}
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="border-l border-brand-border flex flex-col overflow-auto">
          <div className="relative border-b border-brand-border shrink-0">
            <div className="aspect-video bg-[#080D0C] flex items-center justify-center relative overflow-hidden">
              {cameraState === "active" ? (
                <video
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  ref={(el) => {
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-brand-muted">
                  <Camera className="w-10 h-10" />
                  <span className="text-xs">No camera feed</span>
                </div>
              )}
              <span className="absolute top-2 left-2 text-xs text-brand-green bg-brand-dark/70 px-2 py-0.5 rounded">
                USER CAM
              </span>
              {sessionActive && result && (
                <div className="absolute bottom-2 left-2 right-2">
                  <EmotionBadge emotion={result.emotion} size="sm" />
                </div>
              )}
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col gap-5 overflow-auto">
            <h3 className="font-semibold text-sm text-brand-muted uppercase tracking-wider">
              Real-time Insights
            </h3>

            <div className="flex flex-col items-center gap-2">
              <EngagementRing score={result?.engagement.score ?? 0} size={140} />
              <p className="text-sm font-medium">Overall Engagement</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: "Interest (Positive)",
                  value: result?.engagement.positive ?? 0,
                  color: "#00D4A4",
                  level: (result?.engagement.positive ?? 0) >= 70 ? "High" : (result?.engagement.positive ?? 0) >= 40 ? "Medium" : "Low",
                },
                {
                  label: "Confusion (Negative)",
                  value: result?.engagement.negative ?? 0,
                  color: "#EF4444",
                  level: (result?.engagement.negative ?? 0) >= 70 ? "High" : (result?.engagement.negative ?? 0) >= 40 ? "Medium" : "Low",
                },
                {
                  label: "Amusement (Neutral)",
                  value: result?.engagement.neutral ?? 0,
                  color: "#8FA8A4",
                  level: (result?.engagement.neutral ?? 0) >= 70 ? "High" : (result?.engagement.neutral ?? 0) >= 40 ? "Medium" : "Low",
                },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-brand-muted">{bar.label}</span>
                    <span style={{ color: bar.color }} className="font-medium">
                      {bar.level} ({Math.round(bar.value)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-brand-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {result?.probs && (
              <div>
                <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">Emotion Breakdown</p>
                <div className="space-y-2">
                  {Object.entries(result.probs)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([emotion, pct]) => (
                      <div key={emotion} className="flex items-center gap-2 text-xs">
                        <span className="capitalize text-brand-muted w-20 truncate">{emotion}</span>
                        <div className="flex-1 h-1 bg-brand-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-green transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-white w-8 text-right">{Math.round(pct)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wider mb-3">Event Stream</p>
              <AnimatePresence initial={false}>
                {events.length === 0 ? (
                  <p className="text-xs text-brand-muted italic">
                    {sessionActive ? "Waiting for first analysis…" : "Start a session to see events"}
                  </p>
                ) : (
                  events.map((ev) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between py-1.5 border-b border-brand-border/40 last:border-0"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <Zap className="w-3 h-3 text-brand-green shrink-0" />
                        <span className="text-white capitalize">{ev.text}</span>
                      </div>
                      <span className="text-xs text-brand-muted shrink-0 ml-2">{ev.age}</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
