import type { ActivitySelection } from "./crypto/records";
import type { DecryptedEntry } from "../hooks/useEntries";

export const MOOD_PARAM = "Mood";
export const DAY_ACTIVITIES_PARAM = "Day Activities";
export const CORRELATION_WINDOW_DAYS = 30;
export const MIN_ACTIVITY_DAYS = 3;

export interface ActivityScore {
  key: string;
  label: string;
  days: number;
  avgMood: number;
  lift: number;
}

export interface ActivityCorrelation {
  baselineMood: number;
  up: ActivityScore[];
  down: ActivityScore[];
  sufficient: boolean;
}

interface DayPoint {
  mood: number;
  activities: ActivitySelection[];
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function computeActivityCorrelation(
  entries: DecryptedEntry[],
  paramNameById: (id: string) => string | undefined,
  labelFor: (key: string, customLabel?: string) => string,
): ActivityCorrelation {
  const byDay = new Map<string, { mood: number[]; activities: ActivitySelection[] }>();

  for (const e of entries) {
    const name = paramNameById(e.parameterId);
    if (!name) continue;
    const day = dayKey(e.createdAt);

    if (name === MOOD_PARAM) {
      if (typeof e.value !== "number") continue;
      if (!byDay.has(day)) byDay.set(day, { mood: [], activities: [] });
      byDay.get(day)!.mood.push(e.value);
    } else if (name === DAY_ACTIVITIES_PARAM) {
      const acts = e.activities ?? [];
      if (acts.length === 0) continue;
      if (!byDay.has(day)) byDay.set(day, { mood: [], activities: [] });
      byDay.get(day)!.activities.push(...acts);
    }
  }

  const days: DayPoint[] = [];
  for (const point of byDay.values()) {
    if (point.mood.length === 0 || point.activities.length === 0) continue;
    days.push({
      mood: point.mood.reduce((s, v) => s + v, 0) / point.mood.length,
      activities: point.activities,
    });
  }

  if (days.length < MIN_ACTIVITY_DAYS) {
    return { baselineMood: 0, up: [], down: [], sufficient: false };
  }

  const baselineMood = days.reduce((s, d) => s + d.mood, 0) / days.length;

  const scores = new Map<string, { label: string; sum: number; count: number }>();
  const addScore = (key: string, label: string, mood: number) => {
    const cur = scores.get(key) ?? { label, sum: 0, count: 0 };
    cur.sum += mood;
    cur.count += 1;
    scores.set(key, cur);
  };

  for (const d of days) {
    const seen = new Set<string>();
    for (const a of d.activities) {
      if (seen.has(a.key)) continue;
      seen.add(a.key);
      addScore(a.key, labelFor(a.key, a.label), d.mood);
    }
  }

  const scored: ActivityScore[] = [];
  for (const [key, s] of scores) {
    if (s.count < MIN_ACTIVITY_DAYS) continue;
    const avgMood = s.sum / s.count;
    scored.push({ key, label: s.label, days: s.count, avgMood, lift: avgMood - baselineMood });
  }

  const sorted = [...scored].sort((a, b) => b.lift - a.lift);
  const up = sorted.filter((s) => s.lift > 0).slice(0, 3);
  const down = sorted
    .filter((s) => s.lift < 0)
    .sort((a, b) => a.lift - b.lift)
    .slice(0, 3);

  return { baselineMood, up, down, sufficient: true };
}
