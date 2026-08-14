import { describe, it, expect } from 'vitest';
import { findLatestReframe } from '../reframeLibrary';
import { DistortionKey } from '../distortionsQuiz';
import type { DecryptedEntry } from '../../hooks/useEntries';

function makeEntry(
  id: string,
  createdAt: string,
  distortions: DistortionKey[],
  alternativeThought?: string,
): DecryptedEntry {
  return {
    id,
    userId: 'u1',
    parameterId: 'p-mood',
    value: 5,
    note: null,
    activities: [],
    distortions,
    alternativeThought,
    createdAt,
  };
}

describe('findLatestReframe', () => {
  it('returns null when no entry has the tag with an alternative thought', () => {
    const entries = [
      makeEntry('a', '2026-08-01T10:00:00.000Z', [DistortionKey.Magnification], undefined),
      makeEntry('b', '2026-08-02T10:00:00.000Z', [DistortionKey.AllOrNothing], 'Другой текст'),
    ];
    expect(findLatestReframe(entries, DistortionKey.Magnification)).toBeNull();
  });

  it('returns the most recent alternative thought for the given tag', () => {
    const entries = [
      makeEntry('a', '2026-08-01T10:00:00.000Z', [DistortionKey.JumpingToConclusions], 'Старое'),
      makeEntry(
        'b',
        '2026-08-12T10:00:00.000Z',
        [DistortionKey.JumpingToConclusions],
        'Скорее всего, он просто занят',
      ),
      makeEntry('c', '2026-08-05T10:00:00.000Z', [DistortionKey.JumpingToConclusions], 'Среднее'),
    ];
    const result = findLatestReframe(entries, DistortionKey.JumpingToConclusions);
    expect(result?.alternativeThought).toBe('Скорее всего, он просто занят');
    expect(result?.createdAt).toBe('2026-08-12T10:00:00.000Z');
  });

  it('ignores entries with a blank alternative thought', () => {
    const entries = [makeEntry('a', '2026-08-01T10:00:00.000Z', [DistortionKey.Labeling], '   ')];
    expect(findLatestReframe(entries, DistortionKey.Labeling)).toBeNull();
  });
});
