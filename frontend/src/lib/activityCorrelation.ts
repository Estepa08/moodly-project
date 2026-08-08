import type { ActivitySelection } from "./crypto/records";
import type { DecryptedEntry } from "../hooks/useEntries";

export const MOOD_PARAM = "Mood";
export const SLEEP_PARAM = "Sleep";
export const ENERGY_PARAM = "Energy";
export const ANXIETY_PARAM = "Anxiety";
export const DAY_ACTIVITIES_PARAM = "Day Activities";
export const CORRELATION_WINDOW_DAYS = 30;
export const MIN_ACTIVITY_DAYS = 3;

export type CorrelationMetric = "mood" | "sleep" | "energy" | "anxiety";

export const CORRELATION_METRICS: CorrelationMetric[] = ["mood", "sleep", "energy", "anxiety"];

export function metricParamName(metric: CorrelationMetric): string {
  switch (metric) {
    case "mood":
      return MOOD_PARAM;
    case "sleep":
      return SLEEP_PARAM;
    case "energy":
      return ENERGY_PARAM;
    case "anxiety":
      return ANXIETY_PARAM;
  }
}

/** Тревожность выше = хуже: инвертируем, чтобы везде «больше — лучше». */
function normalizeMetric(metric: CorrelationMetric, value: number): number {
  return metric === "anxiety" ? 10 - value : value;
}

export interface ActivityScore {
  key: string;
  label: string;
  days: number;
  avgValue: number;
  lift: number;
}

export interface MetricCorrelation {
  metric: CorrelationMetric;
  baseline: number;
  daysTracked: number;
  up: ActivityScore[];
  down: ActivityScore[];
  sufficient: boolean;
}

interface DayPoint {
  value: number;
  activities: ActivitySelection[];
}

function dayKeyLocal(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function computeActivityCorrelation(
  entries: DecryptedEntry[],
  paramNameById: (id: string) => string | undefined,
  labelFor: (key: string, customLabel?: string) => string,
): MetricCorrelation {
  return computeMetricCorrelation(entries, paramNameById, labelFor, "mood");
}

export function computeMetricCorrelation(
  entries: DecryptedEntry[],
  paramNameById: (id: string) => string | undefined,
  labelFor: (key: string, customLabel?: string) => string,
  metric: CorrelationMetric,
): MetricCorrelation {
  const paramName = metricParamName(metric);
  const byDay = new Map<string, { values: number[]; activities: ActivitySelection[] }>();

  for (const e of entries) {
    const name = paramNameById(e.parameterId);
    if (!name) continue;
    const day = dayKeyLocal(e.createdAt);

    if (name === paramName) {
      if (typeof e.value !== "number") continue;
      if (!byDay.has(day)) byDay.set(day, { values: [], activities: [] });
      byDay.get(day)!.values.push(e.value);
    } else if (name === DAY_ACTIVITIES_PARAM) {
      const acts = e.activities ?? [];
      if (acts.length === 0) continue;
      if (!byDay.has(day)) byDay.set(day, { values: [], activities: [] });
      byDay.get(day)!.activities.push(...acts);
    }
  }

  const days: DayPoint[] = [];
  for (const point of byDay.values()) {
    if (point.values.length === 0 || point.activities.length === 0) continue;
    const raw = point.values.reduce((s, v) => s + v, 0) / point.values.length;
    days.push({
      value: normalizeMetric(metric, raw),
      activities: point.activities,
    });
  }

  const daysTracked = days.length;

  if (daysTracked < MIN_ACTIVITY_DAYS) {
    return {
      metric,
      baseline: 0,
      daysTracked,
      up: [],
      down: [],
      sufficient: false,
    };
  }

  const baseline = days.reduce((s, d) => s + d.value, 0) / days.length;

  const scores = new Map<string, { label: string; sum: number; count: number }>();
  const addScore = (key: string, label: string, value: number) => {
    const cur = scores.get(key) ?? { label, sum: 0, count: 0 };
    cur.sum += value;
    cur.count += 1;
    scores.set(key, cur);
  };

  for (const d of days) {
    const seen = new Set<string>();
    for (const a of d.activities) {
      if (seen.has(a.key)) continue;
      seen.add(a.key);
      addScore(a.key, labelFor(a.key, a.label), d.value);
    }
  }

  const scored: ActivityScore[] = [];
  for (const [key, s] of scores) {
    if (s.count < MIN_ACTIVITY_DAYS) continue;
    const avgValue = s.sum / s.count;
    scored.push({ key, label: s.label, days: s.count, avgValue, lift: avgValue - baseline });
  }

  const sorted = [...scored].sort((a, b) => b.lift - a.lift);
  const up = sorted.filter((s) => s.lift > 0).slice(0, 3);
  const down = sorted
    .filter((s) => s.lift < 0)
    .sort((a, b) => a.lift - b.lift)
    .slice(0, 3);

  return { metric, baseline, daysTracked, up, down, sufficient: true };
}

export function computeAllMetricCorrelations(
  entries: DecryptedEntry[],
  paramNameById: (id: string) => string | undefined,
  labelFor: (key: string, customLabel?: string) => string,
): Record<CorrelationMetric, MetricCorrelation> {
  const result = {} as Record<CorrelationMetric, MetricCorrelation>;
  for (const metric of CORRELATION_METRICS) {
    result[metric] = computeMetricCorrelation(entries, paramNameById, labelFor, metric);
  }
  return result;
}
