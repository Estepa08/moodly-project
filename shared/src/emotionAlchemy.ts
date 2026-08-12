// Справочник «Лаборатории эмоций» — алхимия на основе колеса эмоций Плутчика.
// Единый источник правды для backend и frontend (см. emotion-alchemy-data.json).

import data from "./emotion-alchemy-data.json" with { type: "json" };

export type EmotionKey =
  | "joy"
  | "trust"
  | "fear"
  | "surprise"
  | "sadness"
  | "disgust"
  | "anger"
  | "anticipation";

export type DyadLevel = 1 | 2 | 3 | 4;

export interface EmotionInfo {
  key: EmotionKey;
  name: string;
}

export interface DyadInfo {
  key: string;
  name: string;
  level: DyadLevel;
  emotions: [EmotionKey, EmotionKey];
  /** Диады-предусловия (только для уровня 4 — противоположности). */
  requiresDyads?: string[];
}

export interface EmotionAlchemyData {
  emotions: EmotionInfo[];
  dyads: DyadInfo[];
}

export const EMOTION_ALCHEMY_DATA = data as EmotionAlchemyData;

export const EMOTIONS: EmotionInfo[] = EMOTION_ALCHEMY_DATA.emotions;

export const DYADS: DyadInfo[] = EMOTION_ALCHEMY_DATA.dyads;

const DYADS_BY_KEY = new Map(DYADS.map((d) => [d.key, d]));

// Сколько диад в каждом уровне: первичных 8, вторичных 8, третичных 8,
// противоположностей 4.
export const DYAD_COUNT_BY_LEVEL: Record<DyadLevel, number> = { 1: 8, 2: 8, 3: 8, 4: 4 };

export function getDyadByKey(key: string): DyadInfo | undefined {
  return DYADS_BY_KEY.get(key);
}

export function isEmotionKey(value: string): value is EmotionKey {
  return EMOTIONS.some((e) => e.key === value);
}

// Поиск диады по паре эмоций без учёта порядка (joy+trust == trust+joy).
export function findDyadByEmotions(emotionA: string, emotionB: string): DyadInfo | undefined {
  const pair = new Set([emotionA, emotionB]);
  return DYADS.find((d) => {
    const [a, b] = d.emotions;
    return pair.has(a) && pair.has(b) && a !== b;
  });
}

// Все ключи диад уровня level.
export function dyadKeysByLevel(level: DyadLevel): string[] {
  return DYADS.filter((d) => d.level === level).map((d) => d.key);
}
