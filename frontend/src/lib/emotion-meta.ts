import { type LucideIcon } from "lucide-react";
import {
  Laugh,
  Handshake,
  ShieldAlert,
  PartyPopper,
  Frown,
  Annoyed,
  Angry,
  Hourglass,
} from "lucide-react";

const EMOTION_COLORS: Record<string, { color: string; tint: string }> = {
  joy: { color: "#B07B1F", tint: "#FDF3DC" },
  trust: { color: "#1E7A4C", tint: "#E7F7F0" },
  fear: { color: "#0E7D6B", tint: "#E4F4F1" },
  surprise: { color: "#1D6FB8", tint: "#E8F1FB" },
  sadness: { color: "#5B5FD6", tint: "#EDEBFD" },
  disgust: { color: "#8B5FA6", tint: "#F3ECF8" },
  anger: { color: "#D14343", tint: "#FBE9E9" },
  anticipation: { color: "#B26A1B", tint: "#FDF1E0" },
};

const EMOTION_ICONS: Record<string, LucideIcon> = {
  joy: Laugh,
  trust: Handshake,
  fear: ShieldAlert,
  surprise: PartyPopper,
  sadness: Frown,
  disgust: Annoyed,
  anger: Angry,
  anticipation: Hourglass,
};

export interface EmotionMeta {
  key: string;
  name: string;
  icon: LucideIcon;
  color: string;
  tint: string;
}

const EMOTIONS = [
  { key: "joy" },
  { key: "trust" },
  { key: "fear" },
  { key: "surprise" },
  { key: "sadness" },
  { key: "disgust" },
  { key: "anger" },
  { key: "anticipation" },
];

export const EMOTION_META: Record<string, EmotionMeta> = Object.fromEntries(
  EMOTIONS.map((e) => [
    e.key,
    {
      key: e.key,
      name: `emotionLab.emotions.${e.key}`,
      icon: EMOTION_ICONS[e.key] ?? Laugh,
      color: EMOTION_COLORS[e.key]?.color ?? "#7B5AF0",
      tint: EMOTION_COLORS[e.key]?.tint ?? "#EDE8FD",
    },
  ]),
);

export function emotionMeta(key: string): EmotionMeta {
  return (
    EMOTION_META[key] ?? {
      key,
      name: `emotionLab.emotions.${key}`,
      icon: Laugh,
      color: "#7B5AF0",
      tint: "#EDE8FD",
    }
  );
}
