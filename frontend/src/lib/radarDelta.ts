import { DistortionKey } from './distortionsQuiz';

export interface DistortionEntry {
  key: DistortionKey;
  score: number;
}

export interface RadarComparison {
  current: DistortionEntry[];
  previous: DistortionEntry[] | null;
  currentDate: string;
  previousDate: string | null;
}

interface RadarResultLike {
  completedAt: string;
  flags?: unknown;
}

type DistortionsFlag = Record<string, Record<string, { score: number }>> | undefined;

export function hasDistortionsFlags(result: RadarResultLike): boolean {
  const flags = result.flags as { distortions?: unknown } | undefined;
  return flags?.distortions != null;
}

export function getDistortions(result: RadarResultLike): DistortionEntry[] {
  const flags = result.flags as DistortionsFlag;
  const distortions = flags?.distortions;
  if (!distortions) return [];
  return Object.entries(distortions).map(([key, value]) => ({
    key: key as DistortionKey,
    score: value.score,
  }));
}

export function buildRadarComparison(
  results: RadarResultLike[] | undefined | null,
): RadarComparison | null {
  if (!results || results.length === 0) return null;

  const cdResults = results
    .filter(hasDistortionsFlags)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));

  if (cdResults.length === 0) return null;

  const current = getDistortions(cdResults[cdResults.length - 1]);
  if (current.length === 0) return null;

  const previousResult = cdResults.length > 1 ? cdResults[cdResults.length - 2] : null;
  const previous = previousResult ? getDistortions(previousResult) : null;

  return {
    current,
    previous: previous && previous.length > 0 ? previous : null,
    currentDate: cdResults[cdResults.length - 1].completedAt,
    previousDate:
      previousResult && previous && previous.length > 0 ? previousResult.completedAt : null,
  };
}

export function distortionDelta(
  previous: DistortionEntry[] | null,
  current: DistortionEntry[],
  key: DistortionKey,
): number | null {
  if (!previous) return null;
  const prev = previous.find((entry) => entry.key === key);
  const cur = current.find((entry) => entry.key === key);
  if (prev === undefined || !cur) return null;
  return cur.score - prev.score;
}
