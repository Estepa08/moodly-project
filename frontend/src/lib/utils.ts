import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MS_PER_DAY, Period } from './constants';

export const PERIODS = [
  { key: Period.OneWeek, labelKey: 'dashboard.thisWeek', days: 7 },
  { key: Period.TwoWeeks, labelKey: 'dashboard.twoWeeks', days: 14 },
  { key: Period.OneMonth, labelKey: 'dashboard.oneMonth', days: 30 },
  { key: Period.ThreeMonths, labelKey: 'dashboard.threeMonths', days: 90 },
  { key: Period.All, labelKey: 'dashboard.allTime', days: Infinity },
] as const;

// Rolling-window queries (e.g. "last 30 days") anchor `to` to `new Date()` at
// render time, so two components mounted a few seconds apart compute
// millisecond-different timestamps for what's really the same window —
// react-query hashes params into the cache key, so those never share a cache
// entry or an in-flight request. Rounding down to the minute makes
// same-window requests within that minute collapse onto one query key.
export function roundDownToMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / 60_000) * 60_000);
}

export function getDateRange(period: Period): { from?: string; to?: string } {
  const p = PERIODS.find((x) => x.key === period);
  if (!p || p.days === Infinity) return {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(today.getTime() - p.days * 24 * 60 * 60 * 1000);
  const to = new Date(today.getTime() + MS_PER_DAY);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function filterByPeriod<T extends { completedAt: string }>(
  results: T[] | undefined | null,
  period: Period,
): T[] | undefined {
  if (!results) return undefined;
  const range = getDateRange(period);
  if (!range.from || !range.to) return results;
  const from = new Date(range.from).getTime();
  const toExclusive = new Date(range.to).getTime();
  return results.filter((r) => {
    const t = new Date(r.completedAt).getTime();
    return t >= from && t < toExclusive;
  });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isWithinLastDays(dateStr: string, days: number): boolean {
  const cutoff = Date.now() - days * MS_PER_DAY;
  return new Date(dateStr).getTime() >= cutoff;
}

export function formatDateShort(
  date: Date | string,
  lang?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  return d.toLocaleDateString(locale, options ?? { month: 'short', day: 'numeric' });
}

export function formatChartDate(date: Date | string, lang?: string, showYear?: boolean): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(showYear && { year: 'numeric' }),
  });
}
