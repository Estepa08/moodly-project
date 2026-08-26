import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParameters } from './useParameters';
import { useEntries, useCreateEntry, type DecryptedEntry } from './useEntries';
import { useCreatureState } from '../features/gamification';
import { TEXT_PARAMS, Period, Trend, ParameterName } from '../lib/constants';
import { isWithinLastDays, formatChartDate, getDateRange } from '../lib/utils';

type Entry = DecryptedEntry;

const DASHBOARD_EXCLUDED_PARAMS = new Set<string>(['Thought Journal Mood']);

const SUMMARY_PERIOD = Period.TwoWeeks;

function unionDateRange(
  a: { from?: string; to?: string },
  b: { from?: string; to?: string },
): { from?: string; to?: string } {
  if (!a.from || !b.from) return {};
  const from = new Date(Math.min(Date.parse(a.from), Date.parse(b.from))).toISOString();
  const to = new Date(Math.max(Date.parse(a.to!), Date.parse(b.to!))).toISOString();
  return { from, to };
}

function entriesInRange(
  entries: Entry[] | undefined,
  range: { from?: string; to?: string },
): Entry[] {
  if (!entries || !range.from) return entries ?? [];
  const from = Date.parse(range.from);
  const to = Date.parse(range.to!);
  return entries.filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return t >= from && t < to;
  });
}

export function useDashboardData(period: Period) {
  const { i18n } = useTranslation();

  const { data: params } = useParameters();
  const dateRange = useMemo(
    () => unionDateRange(getDateRange(period), getDateRange(SUMMARY_PERIOD)),
    [period],
  );
  const { data: allEntries, isLoading: entriesLoading } = useEntries(dateRange);
  const gratitudeParam = useMemo(() => params?.find((p) => p.name === 'Gratitude'), [params]);
  const { data: gratitudeAllEntries } = useEntries(
    gratitudeParam ? { parameterId: gratitudeParam.id } : undefined,
  );
  const { data: creatureState } = useCreatureState();
  const createEntry = useCreateEntry();

  const numericParams = useMemo(
    () =>
      params?.filter(
        (p) => !TEXT_PARAMS.has(p.name as ParameterName) && !DASHBOARD_EXCLUDED_PARAMS.has(p.name),
      ),
    [params],
  );

  const paramNames = useMemo(() => {
    if (!numericParams) return ['Anxiety', 'Sleep', 'Mood', 'Energy'];
    return numericParams.map((p) => p.name);
  }, [numericParams]);

  const paramMap = useMemo(() => {
    const map = new Map<string, string>();
    if (params) {
      for (const p of params) map.set(p.id, p.name);
    }
    return map;
  }, [params]);

  const entriesByParam = useMemo(() => {
    if (!allEntries) return new Map<string, Entry[]>();
    const map = new Map<string, Entry[]>();
    for (const e of allEntries) {
      const name = paramMap.get(e.parameterId) ?? e.parameterId;
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(e);
    }
    return map;
  }, [allEntries, paramMap]);

  const chartEntries = useMemo(
    () => entriesInRange(allEntries, getDateRange(period)),
    [allEntries, period],
  );

  const trendData = useMemo(() => {
    if (!chartEntries || chartEntries.length === 0) return [];
    const sorted = [...chartEntries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return sorted.map((e) => {
      const created = new Date(e.createdAt);
      const name = paramMap.get(e.parameterId) ?? e.parameterId;
      return {
        date: created.getTime(),
        dateLabel: formatChartDate(created, i18n.language, period === Period.All),
        [name]: e.value,
      };
    });
  }, [chartEntries, paramMap, i18n.language, period]);

  const wellbeing = useMemo(() => {
    if (!allEntries) return { average: null, trend: Trend.Flat };
    const range = getDateRange(SUMMARY_PERIOD);
    const currentStart = range.from ? Date.parse(range.from) : 0;
    const currentEnd = range.to ? Date.parse(range.to) : Date.now();
    const periodMs = currentEnd - currentStart;
    const prevStart = currentStart - periodMs;
    const prevEnd = currentStart;

    const calcAvg = (entries: Entry[], start: number, end: number) => {
      const filtered = entries.filter((e) => {
        const t = new Date(e.createdAt).getTime();
        return t >= start && t < end;
      });
      if (filtered.length === 0) return null;
      return filtered.reduce((s, e) => s + e.value, 0) / filtered.length;
    };

    const perParam = paramNames.map((name) => {
      const paramEntries = entriesByParam.get(name) ?? [];
      const current = calcAvg(paramEntries, currentStart, currentEnd);
      const previous = calcAvg(paramEntries, prevStart, prevEnd);
      let trend: Trend = Trend.Flat;
      if (current !== null && previous !== null) {
        trend = current > previous ? Trend.Up : current < previous ? Trend.Down : Trend.Flat;
      }
      return { name, average: current, previous, trend };
    });

    const wellbeingScore = (getValue: (name: string) => number | null) => {
      const values: number[] = [];
      for (const name of ['Mood', 'Energy', 'Sleep']) {
        const v = getValue(name);
        if (v !== null) values.push(v);
      }
      const anxiety = getValue('Anxiety');
      if (anxiety !== null) values.push(10 - anxiety);
      return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
    };
    const currentByName = new Map(perParam.map((p) => [p.name, p.average]));
    const previousByName = new Map(perParam.map((p) => [p.name, p.previous]));
    const wellbeingCurrent = wellbeingScore((name) => currentByName.get(name) ?? null);
    const wellbeingPrevious = wellbeingScore((name) => previousByName.get(name) ?? null);
    let wellbeingTrend: Trend = Trend.Flat;
    if (wellbeingCurrent !== null && wellbeingPrevious !== null) {
      wellbeingTrend =
        wellbeingCurrent > wellbeingPrevious
          ? Trend.Up
          : wellbeingCurrent < wellbeingPrevious
            ? Trend.Down
            : Trend.Flat;
    }

    return { average: wellbeingCurrent, trend: wellbeingTrend };
  }, [allEntries, paramNames, entriesByParam]);

  const gratitudeStats = useMemo(() => {
    const weekCount = (gratitudeAllEntries ?? []).filter((e) =>
      isWithinLastDays(e.createdAt, 7),
    ).length;
    return { weekCount };
  }, [gratitudeAllEntries]);

  return {
    numericParams,
    trendData,
    paramNames,
    wellbeing,
    entriesByParam,
    creatureState,
    createEntry,
    gratitudeStats,
    isDataLoading: entriesLoading,
  };
}
