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

// Библиотека мыслей-боссов: 2 варианта на каждое искажение (i18n-ключи,
// см. thoughtBattle.bosses.<key> в translation.json). Первый вариант —
// канонический пример из distortionsLibrary.<key>.example, второй — новый.
const LIBRARY_BOSS_KEYS: Record<DistortionKey, string[]> = {
  [DistortionKey.AllOrNothing]: ['allOrNothing_1', 'allOrNothing_2'],
  [DistortionKey.Overgeneralization]: ['overgeneralization_1', 'overgeneralization_2'],
  [DistortionKey.MentalFilter]: ['mentalFilter_1', 'mentalFilter_2'],
  [DistortionKey.DiscountingPositive]: ['discountingPositive_1', 'discountingPositive_2'],
  [DistortionKey.JumpingToConclusions]: ['jumpingToConclusions_1', 'jumpingToConclusions_2'],
  [DistortionKey.Magnification]: ['magnification_1', 'magnification_2'],
  [DistortionKey.EmotionalReasoning]: ['emotionalReasoning_1', 'emotionalReasoning_2'],
  [DistortionKey.ShouldStatements]: ['shouldStatements_1', 'shouldStatements_2'],
  [DistortionKey.Labeling]: ['labeling_1', 'labeling_2'],
  [DistortionKey.Personalization]: ['personalization_1', 'personalization_2'],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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
 * библиотеки. Возвращает null только если нет вообще ни одного искажения
 * (не бывает — библиотека покрывает все 10).
 */
export function pickBoss(entries: DecryptedEntry[], thoughtLabel: string): Boss {
  const journalCandidates = entries.filter(
    (e) => e.distortions && e.distortions.length > 0 && e.note,
  );

  if (journalCandidates.length > 0) {
    const entry = pickRandom(journalCandidates);
    const distortionKey = pickRandom(entry.distortions!);
    const extracted = entry.note ? extractThoughtBlock(entry.note, thoughtLabel) : null;
    if (extracted) {
      return {
        key: `journal-${entry.id}`,
        distortionKey,
        text: extracted,
        source: 'journal',
      };
    }
  }

  const distortionKey = pickRandom(DISTORTION_KEYS);
  const bossKey = pickRandom(LIBRARY_BOSS_KEYS[distortionKey]);
  return {
    key: bossKey,
    distortionKey,
    text: '', // текст берётся из i18n по bossKey на стороне компонента
    source: 'library',
  };
}
