const BASE = "http://localhost:8000";

export interface AnalyzeResult {
  emotion: string;
  probs: Record<string, number>;
  engagement: {
    score: number;
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface SessionSummary {
  avg_engagement: number;
  peak_engagement: number;
  duration_seconds: number;
  dominant_emotion: string;
  emotion_distribution: Record<string, number>;
  engagement_timeline: { t: number; score: number }[];
  avg_positive: number;
  avg_neutral: number;
  avg_negative: number;
  sample_count: number;
}

export async function analyzeSegment(
  sessionId: string,
  videoBlob: Blob
): Promise<AnalyzeResult> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("video", videoBlob, "segment.webm");

  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Analyze failed");
  return res.json();
}

export async function fetchSummary(sessionId: string): Promise<SessionSummary> {
  const res = await fetch(`${BASE}/session/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Summary failed");
  return res.json();
}
