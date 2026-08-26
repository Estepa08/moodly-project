import { DISTORTION_KEYS, DistortionKey } from '../../lib/distortionsQuiz';

export interface Boss {
  /** Ключ мысли-босса в библиотеке (совпадает с i18n-ключом thoughtBattle.bosses.<key>) */
  key: string;
  distortionKey: DistortionKey;
}

// Библиотека мыслей-боссов: 10 вариантов на каждое искажение (i18n-ключи,
// см. thoughtBattle.bosses.<key> в translation.json). Первый вариант —
// канонический пример из distortionsLibrary.<key>.example, остальные новые.
const LIBRARY_BOSS_KEYS: Record<DistortionKey, string[]> = {
  [DistortionKey.AllOrNothing]: [
    'allOrNothing_1',
    'allOrNothing_2',
    'allOrNothing_3',
    'allOrNothing_4',
    'allOrNothing_5',
    'allOrNothing_6',
    'allOrNothing_7',
    'allOrNothing_8',
    'allOrNothing_9',
    'allOrNothing_10',
  ],
  [DistortionKey.Overgeneralization]: [
    'overgeneralization_1',
    'overgeneralization_2',
    'overgeneralization_3',
    'overgeneralization_4',
    'overgeneralization_5',
    'overgeneralization_6',
    'overgeneralization_7',
    'overgeneralization_8',
    'overgeneralization_9',
    'overgeneralization_10',
  ],
  [DistortionKey.MentalFilter]: [
    'mentalFilter_1',
    'mentalFilter_2',
    'mentalFilter_3',
    'mentalFilter_4',
    'mentalFilter_5',
    'mentalFilter_6',
    'mentalFilter_7',
    'mentalFilter_8',
    'mentalFilter_9',
    'mentalFilter_10',
  ],
  [DistortionKey.DiscountingPositive]: [
    'discountingPositive_1',
    'discountingPositive_2',
    'discountingPositive_3',
    'discountingPositive_4',
    'discountingPositive_5',
    'discountingPositive_6',
    'discountingPositive_7',
    'discountingPositive_8',
    'discountingPositive_9',
    'discountingPositive_10',
  ],
  [DistortionKey.JumpingToConclusions]: [
    'jumpingToConclusions_1',
    'jumpingToConclusions_2',
    'jumpingToConclusions_3',
    'jumpingToConclusions_4',
    'jumpingToConclusions_5',
    'jumpingToConclusions_6',
    'jumpingToConclusions_7',
    'jumpingToConclusions_8',
    'jumpingToConclusions_9',
    'jumpingToConclusions_10',
  ],
  [DistortionKey.Magnification]: [
    'magnification_1',
    'magnification_2',
    'magnification_3',
    'magnification_4',
    'magnification_5',
    'magnification_6',
    'magnification_7',
    'magnification_8',
    'magnification_9',
    'magnification_10',
  ],
  [DistortionKey.EmotionalReasoning]: [
    'emotionalReasoning_1',
    'emotionalReasoning_2',
    'emotionalReasoning_3',
    'emotionalReasoning_4',
    'emotionalReasoning_5',
    'emotionalReasoning_6',
    'emotionalReasoning_7',
    'emotionalReasoning_8',
    'emotionalReasoning_9',
    'emotionalReasoning_10',
  ],
  [DistortionKey.ShouldStatements]: [
    'shouldStatements_1',
    'shouldStatements_2',
    'shouldStatements_3',
    'shouldStatements_4',
    'shouldStatements_5',
    'shouldStatements_6',
    'shouldStatements_7',
    'shouldStatements_8',
    'shouldStatements_9',
    'shouldStatements_10',
  ],
  [DistortionKey.Labeling]: [
    'labeling_1',
    'labeling_2',
    'labeling_3',
    'labeling_4',
    'labeling_5',
    'labeling_6',
    'labeling_7',
    'labeling_8',
    'labeling_9',
    'labeling_10',
  ],
  [DistortionKey.Personalization]: [
    'personalization_1',
    'personalization_2',
    'personalization_3',
    'personalization_4',
    'personalization_5',
    'personalization_6',
    'personalization_7',
    'personalization_8',
    'personalization_9',
    'personalization_10',
  ],
};

const LIBRARY_BOSSES: Boss[] = DISTORTION_KEYS.flatMap((distortionKey) =>
  LIBRARY_BOSS_KEYS[distortionKey].map((key) => ({ key, distortionKey })),
);

// Держим в localStorage несколько последних показанных боссов, чтобы одна
// и та же мысль не всплывала снова и снова подряд. Как только пул
// исчерпан — ограничение снимается само (см. pickAvoidingRecent).
const RECENT_STORAGE_KEY = 'moodly_thought_battle_recent';
const RECENT_LIMIT = 8;

function getRecentKeys(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecentKey(key: string) {
  try {
    const recent = getRecentKeys().filter((k) => k !== key);
    localStorage.setItem(
      RECENT_STORAGE_KEY,
      JSON.stringify([key, ...recent].slice(0, RECENT_LIMIT)),
    );
  } catch {
    /* localStorage may throw in private browsing */
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Случайный элемент, по возможности минуя недавно показанные (по key). */
function pickAvoidingRecent<T extends { key: string }>(items: T[], recent: Set<string>): T {
  const fresh = items.filter((item) => !recent.has(item.key));
  return pickRandom(fresh.length > 0 ? fresh : items);
}

/** N случайных искажений, отличных от correct — неверные варианты для шага 1. */
export function pickDistractors(correct: DistortionKey, count = 3): DistortionKey[] {
  const pool = DISTORTION_KEYS.filter((k) => k !== correct);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Выбирает случайную мысль-босса из библиотеки, по возможности минуя
 * недавно показанные (см. RECENT_LIMIT) — если пул отфильтрован полностью,
 * ограничение снимается само.
 */
export function pickBoss(): Boss {
  const recent = new Set(getRecentKeys());
  const boss = pickAvoidingRecent(LIBRARY_BOSSES, recent);
  pushRecentKey(boss.key);
  return boss;
}
