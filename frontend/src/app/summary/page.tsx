"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  Clock,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Play,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchSummary, SessionSummary } from "@/lib/api";
import EngagementRing from "@/components/EngagementRing";
import EmotionBadge from "@/components/EmotionBadge";

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function SummaryContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sid = params.get("sid");

  const [data, setData] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sid) {
      setError("No session ID provided.");
      setLoading(false);
      return;
    }
    fetchSummary(sid)
      .then(setData)
      .catch(() => setError("Could not load session summary. The session may have expired."))
      .finally(() => setLoading(false));
  }, [sid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-muted">Loading your session summary…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center gap-6 px-6">
        <XCircle className="w-16 h-16 text-red-400" />
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Summary Unavailable</h2>
          <p className="text-brand-muted max-w-md">{error || "Unknown error"}</p>
        </div>
        <button
          onClick={() => router.push("/watch")}
          className="flex items-center gap-2 bg-brand-green text-brand-dark font-semibold px-6 py-2.5 rounded-xl"
        >
          <Play className="w-4 h-4" />
          Start New Session
        </button>
      </div>
    );
  }

  const engagementGrade =
    data.avg_engagement >= 75 ? "Excellent"
    : data.avg_engagement >= 55 ? "Good"
    : data.avg_engagement >= 35 ? "Moderate"
    : "Low";

  const gradeColor =
    data.avg_engagement >= 75 ? "#00D4A4"
    : data.avg_engagement >= 55 ? "#6366F1"
    : data.avg_engagement >= 35 ? "#F59E0B"
    : "#EF4444";

  const emotionEntries = Object.entries(data.emotion_distribution).sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="border-b border-brand-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-brand-muted hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <span className="text-brand-border">|</span>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-green" />
            <span className="font-bold text-sm">Session Summary</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/watch")}
          className="flex items-center gap-2 border border-brand-border hover:border-brand-green/40 text-sm px-4 py-1.5 rounded-lg transition-colors text-brand-muted hover:text-white"
        >
          <Play className="w-3.5 h-3.5" />
          New Session
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">Session Complete</h1>
              <p className="text-brand-muted">
                Analyzed <strong className="text-white">{data.sample_count}</strong> frames over{" "}
                <strong className="text-white">{formatDuration(data.duration_seconds)}</strong>
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border"
              style={{ borderColor: `${gradeColor}40`, color: gradeColor, backgroundColor: `${gradeColor}10` }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {engagementGrade} Engagement
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Avg Engagement", value: `${data.avg_engagement}%`, icon: TrendingUp, color: "#00D4A4" },
            { label: "Peak Engagement", value: `${data.peak_engagement}%`, icon: BarChart3, color: "#6366F1" },
            { label: "Session Duration", value: formatDuration(data.duration_seconds), icon: Clock, color: "#F59E0B" },
            { label: "Dominant Emotion", value: data.dominant_emotion, icon: Brain, color: "#EC4899" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${kpi.color}18` }}
                >
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <span className="text-xs text-brand-muted uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold capitalize">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card p-6 flex flex-col items-center justify-center gap-5"
          >
            <p className="text-sm font-medium text-brand-muted uppercase tracking-wider">Overall Score</p>
            <EngagementRing score={data.avg_engagement} size={160} />
            <div className="w-full space-y-2">
              {[
                { label: "Positive", value: data.avg_positive, color: "#00D4A4" },
                { label: "Neutral", value: data.avg_neutral, color: "#8FA8A4" },
                { label: "Negative", value: data.avg_negative, color: "#EF4444" },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-2 text-xs">
                  <span className="text-brand-muted w-16">{bar.label}</span>
                  <div className="flex-1 h-1.5 bg-brand-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
                    />
                  </div>
                  <span className="text-white w-8 text-right">{bar.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-6"
          >
            <p className="text-sm font-medium mb-5 uppercase tracking-wider text-brand-muted">Emotion Distribution</p>
            <div className="space-y-4">
              {emotionEntries.map(([emotion, pct]) => (
                <div key={emotion}>
                  <div className="flex items-center justify-between mb-1.5">
                    <EmotionBadge emotion={emotion} size="sm" />
                    <span className="text-sm font-semibold">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6 flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-medium mb-4 uppercase tracking-wider text-brand-muted">Session Verdict</p>
              <div className="text-4xl font-extrabold mb-2" style={{ color: gradeColor }}>
                {engagementGrade}
              </div>
              <p className="text-brand-muted text-sm leading-relaxed">
                {engagementGrade === "Excellent" &&
                  "You were highly engaged throughout this session. The content captured your attention effectively."}
                {engagementGrade === "Good" &&
                  "You maintained good engagement for most of the session with some dips in attention."}
                {engagementGrade === "Moderate" &&
                  "Your engagement was moderate. Parts of the content may not have held your attention well."}
                {engagementGrade === "Low" &&
                  "Engagement was low during this session. The content may not have resonated with you."}
              </p>
            </div>

            <div className="mt-6 border-t border-brand-border pt-5 text-xs text-brand-muted space-y-1">
              <p>Dominant emotion: <span className="text-white capitalize">{data.dominant_emotion}</span></p>
              <p>Total samples: <span className="text-white">{data.sample_count}</span></p>
              <p>Peak engagement: <span className="text-white">{data.peak_engagement}%</span></p>
            </div>
          </motion.div>
        </div>

        {data.engagement_timeline.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-6 mb-8"
          >
            <p className="text-sm font-medium mb-5 uppercase tracking-wider text-brand-muted">Engagement Timeline</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.engagement_timeline} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D2B" />
                  <XAxis
                    dataKey="t"
                    tick={{ fill: "#8FA8A4", fontSize: 11 }}
                    tickFormatter={(v) => `#${v}`}
                    stroke="#1E2D2B"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#8FA8A4", fontSize: 11 }}
                    stroke="#1E2D2B"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111918",
                      border: "1px solid #1E2D2B",
                      borderRadius: "8px",
                      color: "#E8F0EE",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [`${Math.round(v)}%`, "Engagement"]}
                    labelFormatter={(l) => `Sample #${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#00D4A4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#00D4A4" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/watch")}
            className="flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-8 py-3 rounded-xl"
          >
            <Play className="w-5 h-5" />
            Start New Session
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-2 border border-brand-border text-brand-muted hover:text-white hover:border-brand-green/30 px-8 py-3 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SummaryContent />
    </Suspense>
  );
}
