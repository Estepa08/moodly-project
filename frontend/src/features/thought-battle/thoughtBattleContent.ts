import { DISTORTION_KEYS, DistortionKey } from '../../lib/distortionsQuiz';
import type { DecryptedEntry } from '../../hooks/useEntries';

export type BossSource = 'journal' | 'library';

export interface Boss {
  /** Уникальный ключ раунда (для аналитики/повтора не нужен, но полезен как React key) */
  key: string;
  distortionKey: DistortionKey;
  /** Текст мысли-босса — либо литерал из дневника пользователя, либо i18n-ключ библиотеки */
  text: string;
  source: BossSource;
}

// Библиотека мыслей-боссов: 5 вариантов на каждое искажение (i18n-ключи,
// см. thoughtBattle.bosses.<key> в translation.json). Первый вариант —
// канонический пример из distortionsLibrary.<key>.example, остальные новые.
const LIBRARY_BOSS_KEYS: Record<DistortionKey, string[]> = {
  [DistortionKey.AllOrNothing]: [
    'allOrNothing_1',
    'allOrNothing_2',
    'allOrNothing_3',
    'allOrNothing_4',
    'allOrNothing_5',
  ],
  [DistortionKey.Overgeneralization]: [
    'overgeneralization_1',
    'overgeneralization_2',
    'overgeneralization_3',
    'overgeneralization_4',
    'overgeneralization_5',
  ],
  [DistortionKey.MentalFilter]: [
    'mentalFilter_1',
    'mentalFilter_2',
    'mentalFilter_3',
    'mentalFilter_4',
    'mentalFilter_5',
  ],
  [DistortionKey.DiscountingPositive]: [
    'discountingPositive_1',
    'discountingPositive_2',
    'discountingPositive_3',
    'discountingPositive_4',
    'discountingPositive_5',
  ],
  [DistortionKey.JumpingToConclusions]: [
    'jumpingToConclusions_1',
    'jumpingToConclusions_2',
    'jumpingToConclusions_3',
    'jumpingToConclusions_4',
    'jumpingToConclusions_5',
  ],
  [DistortionKey.Magnification]: [
    'magnification_1',
    'magnification_2',
    'magnification_3',
    'magnification_4',
    'magnification_5',
  ],
  [DistortionKey.EmotionalReasoning]: [
    'emotionalReasoning_1',
    'emotionalReasoning_2',
    'emotionalReasoning_3',
    'emotionalReasoning_4',
    'emotionalReasoning_5',
  ],
  [DistortionKey.ShouldStatements]: [
    'shouldStatements_1',
    'shouldStatements_2',
    'shouldStatements_3',
    'shouldStatements_4',
    'shouldStatements_5',
  ],
  [DistortionKey.Labeling]: ['labeling_1', 'labeling_2', 'labeling_3', 'labeling_4', 'labeling_5'],
  [DistortionKey.Personalization]: [
    'personalization_1',
    'personalization_2',
    'personalization_3',
    'personalization_4',
    'personalization_5',
  ],
};

interface LibraryBoss {
  key: string;
  distortionKey: DistortionKey;
}

const LIBRARY_BOSSES: LibraryBoss[] = DISTORTION_KEYS.flatMap((distortionKey) =>
  LIBRARY_BOSS_KEYS[distortionKey].map((key) => ({ key, distortionKey })),
);

// Держим в localStorage несколько последних показанных боссов (и из
// библиотеки, и из дневника — единый список по key), чтобы одна и та же
// мысль не всплывала снова и снова подряд. Как только пул исчерпан —
// ограничение снимается само (см. pickAvoiding).
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

// Блок «Мысль» в note дневника мыслей записан как «<label>\n<текст>» между
// пустыми строками (см. buildNote() в routes/thought-journal.tsx).
function extractThoughtBlock(note: string, thoughtLabel: string): string | null {
  const blocks = note.split('\n\n');
  for (const block of blocks) {
    if (block.startsWith(thoughtLabel)) {
      const text = block.slice(thoughtLabel.length).trim();
      return text || null;
    }
  }
  return null;
}

/**
 * Выбирает мысль-босса: сперва пробует найти отмеченную искажением запись
 * дневника мыслей (личная, более ценная клинически), иначе — случайную из
 * библиотеки. В обоих случаях старается не повторять недавно показанных
 * (см. RECENT_LIMIT) — если пул отфильтрован полностью, ограничение снимается.
 */
export function pickBoss(entries: DecryptedEntry[], thoughtLabel: string): Boss {
  const recent = new Set(getRecentKeys());

  const journalCandidates = entries
    .filter((e) => e.distortions && e.distortions.length > 0 && e.note)
    .map((e) => ({ key: `journal-${e.id}`, entry: e }));

  if (journalCandidates.length > 0) {
    const picked = pickAvoidingRecent(journalCandidates, recent);
    const distortionKey = pickRandom(picked.entry.distortions!);
    const extracted = picked.entry.note
      ? extractThoughtBlock(picked.entry.note, thoughtLabel)
      : null;
    if (extracted) {
      pushRecentKey(picked.key);
      return {
        key: picked.key,
        distortionKey,
        text: extracted,
        source: 'journal',
      };
    }
  }

  const boss = pickAvoidingRecent(LIBRARY_BOSSES, recent);
  pushRecentKey(boss.key);
  return {
    key: boss.key,
    distortionKey: boss.distortionKey,
    text: '', // текст берётся из i18n по boss.key на стороне компонента
    source: 'library',
  };
}
