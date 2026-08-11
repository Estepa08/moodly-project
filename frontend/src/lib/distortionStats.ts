import { DISTORTION_KEYS, DistortionKey } from "./distortionsQuiz";
import type { DecryptedEntry } from "../hooks/useEntries";

export const MOOD_PARAM = "Mood";

export interface DistortionStat {
  key: DistortionKey;
  /** Сколько записей (с любым параметром) имеют этот тег. */
  count: number;
  /** Средний Mood по дням, где встречался тег (null — если таких дней мало/нет). */
  avgMood: number | null;
  /** Разница avgMood - baseline: меньше нуля = искажение связано с худшим настроением. */
  moodDelta: number | null;
  /** По скольким дням посчитан avgMood. */
  moodDays: number;
}

export interface DistortionStatsResult {
  baseline: number | null;
  stats: DistortionStat[];
  /** Есть ли вообще данные для показа. */
  sufficient: boolean;
}

function dayKeyLocal(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Считает частоту тегов-ловушек и их связь с настроением (аналог activityCorrelation,
 * но по тегам когнитивных искажений, которые висят на записях с заметкой).
 * Всё на клиенте из расшифрованных записей — сервер не участвует.
 */
export function computeDistortionStats(
  entries: DecryptedEntry[],
  paramNameById: (id: string) => string | undefined,
): DistortionStatsResult {
  const moodByDay = new Map<string, number[]>();
  const distortionDays = new Map<DistortionKey, Set<string>>();

  for (const e of entries) {
    const day = dayKeyLocal(e.createdAt);
    const name = paramNameById(e.parameterId);

    if (name === MOOD_PARAM && typeof e.value === "number") {
      const bucket = moodByDay.get(day) ?? [];
      bucket.push(e.value);
      moodByDay.set(day, bucket);
    }

    for (const d of e.distortions ?? []) {
      const set = distortionDays.get(d) ?? new Set<string>();
      set.add(day);
      distortionDays.set(d, set);
    }
  }

  const moodDayValues: number[] = [];
  for (const values of moodByDay.values()) {
    moodDayValues.push(values.reduce((s, v) => s + v, 0) / values.length);
  }

  const baseline =
    moodDayValues.length > 0
      ? moodDayValues.reduce((s, v) => s + v, 0) / moodDayValues.length
      : null;

  const stats: DistortionStat[] = [];
  for (const key of DISTORTION_KEYS) {
    const days = distortionDays.get(key);
    const count = days?.size ?? 0;
    if (count === 0) continue;

    let moodSum = 0;
    let moodN = 0;
    for (const day of days ?? []) {
      const values = moodByDay.get(day);
      if (!values || values.length === 0) continue;
      moodSum += values.reduce((s, v) => s + v, 0) / values.length;
      moodN += 1;
    }

    const avgMood = moodN > 0 ? moodSum / moodN : null;
    stats.push({
      key,
      count,
      avgMood,
      moodDelta: avgMood !== null && baseline !== null ? avgMood - baseline : null,
      moodDays: moodN,
    });
  }

  stats.sort((a, b) => b.count - a.count);

  return {
    baseline,
    stats,
    sufficient: stats.length > 0,
  };
}
