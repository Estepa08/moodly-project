import type { ActivitySelection } from './crypto/records';
import type { DecryptedEntry } from '../hooks/useEntries';

export const MOOD_PARAM = 'Mood';
export const SLEEP_PARAM = 'Sleep';
export const ENERGY_PARAM = 'Energy';
export const ANXIETY_PARAM = 'Anxiety';
export const DAY_ACTIVITIES_PARAM = 'Day Activities';
export const CORRELATION_WINDOW_DAYS = 30;
/**
 * Минимальное число дней, по которому считается сигнал по конкретной активности.
 * Порог поднят с 3 до 5: при n=3 один случайный день даёт ~33% веса выборки
 * и может создать ложный сигнал («активность влияет на состояние»).
 * n=5 — компромисс: активность средней частоты (раз в ~6 дней в окне 30 дней)
 * успевает набрать выборку, а вклад одного дня уже не доминирует (~20%).
 */
export const MIN_ACTIVITY_DAYS = 5;

export type CorrelationMetric = 'mood' | 'sleep' | 'energy' | 'anxiety';

export const CORRELATION_METRICS: CorrelationMetric[] = ['mood', 'sleep', 'energy', 'anxiety'];

export function metricParamName(metric: CorrelationMetric): string {
  switch (metric) {
    case 'mood':
      return MOOD_PARAM;
    case 'sleep':
      return SLEEP_PARAM;
    case 'energy':
      return ENERGY_PARAM;
    case 'anxiety':
      return ANXIETY_PARAM;
  }
}

/** Тревожность выше = хуже: инвертируем, чтобы везде «больше — лучше». */
function normalizeMetric(metric: CorrelationMetric, value: number): number {
  return metric === 'anxiety' ? 10 - value : value;
}

export type Confidence = 'low' | 'medium' | 'high';

export interface ActivityScore {
  key: string;
  label: string;
  /** n — на основе скольки дней посчитан lift */
  days: number;
  avgValue: number;
  lift: number;
  confidence: Confidence;
}

/**
 * Уверенность в сигнале. Базовый уровень по объёму выборки:
 * n<7 → low, 7–14 → medium, 15+ → high.
 * Если разброс (stdDev) сопоставим с величиной эффекта (stdDev >= |lift|),
 * сигнал в пределах шума — понижаем на один уровень (но не ниже low).
 */
function confidenceFor(n: number, stdDev: number, absLift: number): Confidence {
  const base: Confidence = n < 7 ? 'low' : n <= 14 ? 'medium' : 'high';
  if (stdDev >= absLift && base !== 'low') {
    return base === 'high' ? 'medium' : 'low';
  }
  return base;
}

export interface LiftResult {
  baseline: number;
  daysTracked: number;
  up: ActivityScore[];
  down: ActivityScore[];
  sufficient: boolean;
}

export interface MetricCorrelation extends LiftResult {
  metric: CorrelationMetric;
  /**
   * Связь активностей с внутридневным разбросом метрики (max-min за день),
   * а не со средним. Считается только по дням с ≥2 отметками одной метрики —
   * при одном чек-ине в день swing не определён, и такой день сюда не попадает.
   */
  volatility: LiftResult;
}

interface DayPoint {
  value: number;
  /** Размах (max-min) значений метрики за день; null — если отметка была одна. */
  swing: number | null;
  activities: ActivitySelection[];
}

/**
 * Общее ядро подсчёта лифта: группирует активности по ключу, считает
 * среднее/lift/confidence относительно baseline и берёт top-3 в каждую сторону.
 * Используется и для среднего значения метрики за день, и для её
 * внутридневного разброса (volatility) — отличается только тем, какое поле
 * дня передано как `value`.
 */
function computeLift(
  days: { value: number; activities: ActivitySelection[] }[],
  labelFor: (key: string, customLabel?: string) => string,
): LiftResult {
  const daysTracked = days.length;

  if (daysTracked < MIN_ACTIVITY_DAYS) {
    return { baseline: 0, daysTracked, up: [], down: [], sufficient: false };
  }

  const baseline = days.reduce((s, d) => s + d.value, 0) / days.length;

  const scores = new Map<string, { label: string; sum: number; sumSq: number; count: number }>();
  const addScore = (key: string, label: string, value: number) => {
    const cur = scores.get(key) ?? { label, sum: 0, sumSq: 0, count: 0 };
    cur.sum += value;
    cur.sumSq += value * value;
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
    const lift = avgValue - baseline;
    const variance = s.sumSq / s.count - avgValue * avgValue;
    const stdDev = variance > 0 ? Math.sqrt(variance) : 0;
    scored.push({
      key,
      label: s.label,
      days: s.count,
      avgValue,
      lift,
      confidence: confidenceFor(s.count, stdDev, Math.abs(lift)),
    });
  }

  // При равном lift предпочитаем активность с большим days — более надёжный сигнал
  // важнее чуть большей величины эффекта.
  const sorted = [...scored].sort((a, b) => b.lift - a.lift || b.days - a.days);
  const up = sorted.filter((s) => s.lift > 0).slice(0, 3);
  const down = sorted
    .filter((s) => s.lift < 0)
    .sort((a, b) => a.lift - b.lift || b.days - a.days)
    .slice(0, 3);

  return { baseline, daysTracked, up, down, sufficient: true };
}

function dayKeyLocal(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return createdAt.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export function computeActivityCorrelation(
  entries: DecryptedEntry[],
  paramNameById: (id: string) => string | undefined,
  labelFor: (key: string, customLabel?: string) => string,
): MetricCorrelation {
  return computeMetricCorrelation(entries, paramNameById, labelFor, 'mood');
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
      if (typeof e.value !== 'number') continue;
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
    // Инверсия метрики (anxiety) не меняет размах — только сдвигает знак,
    // поэтому swing считаем по «сырым» значениям.
    const swing =
      point.values.length >= 2 ? Math.max(...point.values) - Math.min(...point.values) : null;
    days.push({
      value: normalizeMetric(metric, raw),
      swing,
      activities: point.activities,
    });
  }

  const base = computeLift(days, labelFor);

  const volatilityDays = days
    .filter((d): d is DayPoint & { swing: number } => d.swing !== null)
    .map((d) => ({ value: d.swing, activities: d.activities }));
  const volatility = computeLift(volatilityDays, labelFor);

  return { metric, ...base, volatility };
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
