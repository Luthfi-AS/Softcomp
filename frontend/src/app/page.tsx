"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  Activity,
  BarChart3,
  Eye,
  Play,
  ChevronRight,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react";

const FEATURES = [
  {
    icon: Eye,
    title: "Real-time Emotion Detection",
    desc: "Detects 7 micro-expression categories from your webcam in real time using a hybrid CNN-Transformer architecture optimized with Genetic Algorithm.",
  },
  {
    icon: Activity,
    title: "Fuzzy Engagement Scoring",
    desc: "Converts raw emotion probabilities into a 0–100 engagement score using fuzzy logic, updated every few seconds.",
  },
  {
    icon: BarChart3,
    title: "Session Analytics",
    desc: "Post-session summary with engagement timeline, dominant emotion breakdown, and peak engagement moments.",
  },
  {
    icon: Zap,
    title: "Low-latency Inference",
    desc: "Frames are captured from your webcam every 3–5 seconds — lightweight enough to run alongside any video.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    desc: "Webcam frames are processed in real time and never stored. Your data stays on your device.",
  },
  {
    icon: TrendingUp,
    title: "Actionable Insights",
    desc: "Understand how different content types affect your attention and emotional state over time.",
  },
];

const STATS = [
  { value: "7", label: "Emotion Categories" },
  { value: "94%", label: "Peak Engagement Avg" },
  { value: "3–5s", label: "Update Interval" },
  { value: "LOSO", label: "Validation Method" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-brand-dark text-white overflow-hidden">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-brand-border/50 backdrop-blur-md bg-brand-dark/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-brand-green" />
            <span className="font-bold text-lg">
              CogniTrack <span className="text-brand-green">AI</span>
            </span>
            <span className="text-xs text-brand-muted border border-brand-border rounded px-1.5 py-0.5 ml-1">
              V2.4
            </span>
          </div>
          <button
            onClick={() => router.push("/watch")}
            className="flex items-center gap-2 bg-brand-green text-brand-dark font-semibold text-sm px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all"
          >
            <Play className="w-4 h-4" />
            Start Analyzing
          </button>
        </div>
      </nav>

      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-green/5 blur-[120px]" />
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-brand-green/3 blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-brand-green text-sm font-medium border border-brand-green/30 rounded-full px-4 py-1.5 mb-8 bg-brand-green/5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Real-time Viewer Intelligence
            </span>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
              Know exactly how{" "}
              <span className="gradient-text">engaged</span> you are
            </h1>

            <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              CogniTrack watches your face while you watch videos — detecting
              micro-expressions and computing a real-time engagement score so
              you understand what truly captures your attention.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/watch")}
                className="flex items-center gap-2 bg-brand-green text-brand-dark font-bold text-base px-8 py-3.5 rounded-xl glow-green hover:bg-opacity-90 transition-all"
              >
                <Play className="w-5 h-5" />
                Start Session
                <ChevronRight className="w-4 h-4" />
              </motion.button>
              <button className="text-brand-muted text-sm hover:text-white transition-colors">
                Learn how it works ↓
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {STATS.map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <div className="text-3xl font-extrabold gradient-text mb-1">{s.value}</div>
                <div className="text-xs text-brand-muted uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="card p-1 glow-green-lg"
          >
            <div className="rounded-xl bg-[#0D1918] p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-brand-green/70" />
                <span className="text-xs text-brand-muted ml-2">CogniTrack — Live Session</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-brand-green">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                  Live Monitoring Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-black/40 rounded-lg aspect-video flex items-center justify-center border border-brand-border">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-brand-green/50 mx-auto mb-2" />
                    <p className="text-sm text-brand-muted">YouTube video plays here</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-black/40 rounded-lg aspect-video flex items-center justify-center border border-brand-border relative overflow-hidden">
                    <Eye className="w-8 h-8 text-brand-green/40" />
                    <span className="absolute top-2 left-2 text-xs text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">USER CAM</span>
                  </div>

                  <div className="card p-4 text-center flex-1">
                    <p className="text-xs text-brand-muted mb-2">ENGAGEMENT</p>
                    <p className="text-4xl font-extrabold gradient-text">79%</p>
                    <div className="mt-2 space-y-1">
                      {[["Interest", "88%", "bg-brand-green"], ["Confusion", "12%", "bg-yellow-500"], ["Positive", "65%", "bg-emerald-500"]].map(([l, v, c]) => (
                        <div key={l} className="flex items-center gap-2 text-xs">
                          <span className="text-brand-muted w-16">{l}</span>
                          <div className="flex-1 bg-brand-border rounded-full h-1">
                            <div className={`h-1 rounded-full ${c}`} style={{ width: v }} />
                          </div>
                          <span className="text-white w-8 text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-24" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built on <span className="gradient-text">research-grade</span> models
            </h2>
            <p className="text-brand-muted max-w-xl mx-auto">
              Powered by a hybrid CNN-Transformer architecture with Genetic Algorithm optimization, trained on the CASME II micro-expression dataset using Leave-One-Subject-Out cross-validation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 hover:border-brand-green/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center mb-4 group-hover:bg-brand-green/20 transition-colors">
                  <f.icon className="w-5 h-5 text-brand-green" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center card p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent pointer-events-none" />
          <Brain className="w-12 h-12 text-brand-green mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to understand your attention?</h2>
          <p className="text-brand-muted mb-8">
            Paste any YouTube link, allow camera access, and start tracking your engagement in real time.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/watch")}
            className="inline-flex items-center gap-2 bg-brand-green text-brand-dark font-bold px-8 py-3.5 rounded-xl glow-green"
          >
            <Play className="w-5 h-5" />
            Launch Session
          </motion.button>
        </div>
      </section>

      <footer className="border-t border-brand-border px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-green" />
            <span>CogniTrack</span>
          </div>
          <span>Trained on CASME II · LOSO Cross-validation</span>
        </div>
      </footer>
    </div>
  );
}
