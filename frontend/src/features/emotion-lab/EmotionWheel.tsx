import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { EMOTION_META, emotionMeta } from "./emotionLab";
import type { EmotionKey } from "@moodly/shared";

// Позиции 8 эмоций вокруг колеса (углы в градусах, 0° — верх), противоположности
// размещены друг напротив друга — это ключ к диадам уровня 4.
const ANGLES: Record<string, number> = {
  joy: -90,
  anticipation: -45,
  anger: 0,
  disgust: 45,
  sadness: 90,
  surprise: 135,
  fear: 180,
  trust: 225,
};

const ORDER: EmotionKey[] = [
  "joy",
  "trust",
  "fear",
  "surprise",
  "sadness",
  "disgust",
  "anger",
  "anticipation",
];

interface EmotionWheelProps {
  selected: string[];
  onSelect: (key: string) => void;
}

export default function EmotionWheel({ selected, onSelect }: EmotionWheelProps) {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto w-full max-w-sm aspect-square select-none">
      {ORDER.map((key) => {
        const meta = emotionMeta(key);
        const angle = (ANGLES[key] * Math.PI) / 180;
        const radius = 40;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        const isSelected = selected.includes(key);
        const Icon = meta.icon;

        return (
          <button
            key={key}
            type="button"
            aria-pressed={isSelected}
            aria-label={t(`emotionLab.emotions.${key}`)}
            onClick={() => onSelect(key)}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-neumorphic-sm transition-[transform,box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95",
              isSelected
                ? "border-2 border-primary"
                : "border border-border hover:shadow-neumorphic",
            )}
            style={{ left: `${x}%`, top: `${y}%`, backgroundColor: meta.tint }}
          >
            <Icon
              aria-hidden="true"
              className="w-6 h-6"
              style={{ color: meta.color }}
              strokeWidth={2}
            />
            <span
              className="text-[10px] font-medium leading-none mt-0.5"
              style={{ color: meta.color }}
            >
              {t(`emotionLab.emotions.${key}`)}
            </span>
          </button>
        );
      })}

      {/* Центр колеса — «алхимическая колба» */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex flex-col items-center justify-center bg-secondary border border-border shadow-neumorphic-inset"
        aria-hidden="true"
      >
        <svg
          className="w-8 h-8 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 2v6.5" />
          <path d="M14 2v6.5" />
          <path d="M4 2h16" />
          <path d="M8.5 22h7" />
          <path d="M8.5 14.5v3.75a3.5 3.5 0 0 0 3.5 3.5" />
          <path d="m8.5 14.5-3-3" />
          <path d="m8.5 18.25-3 3" />
          <path d="m15.5 14.5 3-3" />
          <path d="m15.5 18.25 3 3" />
        </svg>
        <span className="text-[9px] font-medium text-muted-foreground">
          {Object.keys(EMOTION_META).length}
        </span>
      </div>
    </div>
  );
}
