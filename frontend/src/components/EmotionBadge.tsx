"use client";

const EMOTION_META: Record<string, { color: string; emoji: string }> = {
  happiness:  { color: "#00D4A4", emoji: "😊" },
  surprise:   { color: "#6366F1", emoji: "😮" },
  others:     { color: "#8FA8A4", emoji: "😐" },
  disgust:    { color: "#EF4444", emoji: "😣" },
  fear:       { color: "#F59E0B", emoji: "😨" },
  repression: { color: "#EC4899", emoji: "😶" },
  sadness:    { color: "#60A5FA", emoji: "😢" },
};

interface Props {
  emotion: string;
  size?: "sm" | "md" | "lg";
}

export default function EmotionBadge({ emotion, size = "md" }: Props) {
  const meta = EMOTION_META[emotion] ?? { color: "#8FA8A4", emoji: "❓" };
  const sizeClass = { sm: "text-xs px-2 py-0.5", md: "text-sm px-3 py-1", lg: "text-base px-4 py-1.5" }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium capitalize ${sizeClass}`}
      style={{
        backgroundColor: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}40`,
      }}
    >
      <span>{meta.emoji}</span>
      {emotion}
    </span>
  );
}
