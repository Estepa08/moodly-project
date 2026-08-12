import { EMOTIONS, DYADS, getDyadByKey, type DyadInfo } from '@moodly/shared';
import type { LucideIcon } from 'lucide-react';
import {
  Laugh,
  Handshake,
  ShieldAlert,
  PartyPopper,
  Frown,
  Annoyed,
  Angry,
  Hourglass,
} from 'lucide-react';

// Мета эмоций для колеса Плутчика: цвет (Pet-палитра проекта) и lucide-иконка.
// Ключи и русские имена берём из @moodly/shared — единого источника правды.

const EMOTION_COLORS: Record<string, { color: string; tint: string }> = {
  joy: { color: '#B07B1F', tint: '#FDF3DC' },
  trust: { color: '#1E7A4C', tint: '#E7F7F0' },
  fear: { color: '#0E7D6B', tint: '#E4F4F1' },
  surprise: { color: '#1D6FB8', tint: '#E8F1FB' },
  sadness: { color: '#5B5FD6', tint: '#EDEBFD' },
  disgust: { color: '#8B5FA6', tint: '#F3ECF8' },
  anger: { color: '#D14343', tint: '#FBE9E9' },
  anticipation: { color: '#B26A1B', tint: '#FDF1E0' },
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
  name: string; // Это ключ для перевода, например: 'emotionLab.emotions.joy'
  icon: LucideIcon;
  color: string;
  tint: string;
}

export const EMOTION_META: Record<string, EmotionMeta> = Object.fromEntries(
  EMOTIONS.map((e) => [
    e.key,
    {
      key: e.key,
      name: `emotionLab.emotions.${e.key}`, // Используем ключ перевода
      icon: EMOTION_ICONS[e.key] ?? Laugh,
      color: EMOTION_COLORS[e.key]?.color ?? '#7B5AF0',
      tint: EMOTION_COLORS[e.key]?.tint ?? '#EDE8FD',
    },
  ]),
);

export function emotionMeta(key: string): EmotionMeta {
  return (
    EMOTION_META[key] ?? {
      key,
      name: `emotionLab.emotions.${key}`,
      icon: Laugh,
      color: '#7B5AF0',
      tint: '#EDE8FD',
    }
  );
}

export type DyadView = DyadInfo;

export const DYADS_BY_LEVEL: Record<1 | 2 | 3 | 4, DyadView[]> = {
  1: DYADS.filter((d) => d.level === 1),
  2: DYADS.filter((d) => d.level === 2),
  3: DYADS.filter((d) => d.level === 3),
  4: DYADS.filter((d) => d.level === 4),
};

export const DYAD_TOTAL = DYADS.length;

export function dyadByKey(key: string): DyadView | undefined {
  return getDyadByKey(key);
}

export const DYAD_COUNT_BY_LEVEL_VIEW: Record<1 | 2 | 3 | 4, number> = {
  1: 8,
  2: 8,
  3: 8,
  4: 4,
};

// Вспомогательная функция для получения переведенного названия диады
export function getDyadName(key: string, t: (key: string) => string): string {
  const translationKey = `emotionLab.dyads.${key}.name`;
  const translation = t(translationKey);
  // Если перевод не найден, используем ключ
  return translation === translationKey ? key : translation;
}

export function getDyadDescription(key: string, t: (key: string) => string): string {
  const translationKey = `emotionLab.dyads.${key}.description`;
  const translation = t(translationKey);
  return translation === translationKey ? '' : translation;
}
