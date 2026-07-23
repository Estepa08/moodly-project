import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParameters } from "./useParameters";
import { useEntries, useCreateEntry } from "./useEntries";
import { useTests, useTestResults } from "./useTests";
import { useCreatureState } from "./useCreature";
import type { components } from "../lib/api-types";
import type { DistortionEntry } from "../components/RadarChart";
import { TEXT_PARAMS } from "../lib/constants";
import { isWithinLastDays } from "../lib/utils";

type Entry = components["schemas"]["Entry"];
type TestResult = components["schemas"]["TestResult"];

export const PERIODS = [
  { key: "1w", labelKey: "dashboard.thisWeek", days: 7 },
  { key: "2w", labelKey: "dashboard.twoWeeks", days: 14 },
  { key: "1m", labelKey: "dashboard.oneMonth", days: 30 },
  { key: "3m", labelKey: "dashboard.threeMonths", days: 90 },
  { key: "all", labelKey: "dashboard.allTime", days: Infinity },
] as const;

const TEST_ABBR_KEYS: Record<string, string> = {
  "PHQ-9": "tests.abbreviation.phq9",
  "GAD-7": "tests.abbreviation.gad7",
  "Burns Anxiety Inventory": "tests.abbreviation.bai",
  "Burns Depression Checklist": "tests.abbreviation.bdc",
  "Cognitive Distortions Assessment": "tests.abbreviation.cd",
};

function getDateRange(period: string): { from?: string; to?: string } {
  const p = PERIODS.find((x) => x.key === period);
  if (!p || p.days === Infinity) return {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(today.getTime() - p.days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: today.toISOString() };
}

export function useDashboardData(period: string) {
  const { t, i18n } = useTranslation();

  const { data: params } = useParameters();
  const dateRange = useMemo(() => getDateRange(period), [period]);
  const { data: allEntries, isLoading: entriesLoading } = useEntries(dateRange);
  const gratitudeParam = useMemo(
    () => params?.find((p) => p.name === "Gratitude"),
    [params],
  );
  const { data: gratitudeAllEntries } = useEntries(
    gratitudeParam ? { parameterId: gratitudeParam.id } : undefined,
  );
  const { data: testResults, isLoading: resultsLoading } = useTestResults();
  const { data: tests } = useTests();
  const { data: creatureState } = useCreatureState();
  const createEntry = useCreateEntry();

  const numericParams = useMemo(() => params?.filter((p) => !TEXT_PARAMS.has(p.name)), [params]);

  const paramNames = useMemo(() => {
    if (!numericParams) return ["Anxiety", "Sleep", "Mood", "Energy"];
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

  const trendData = useMemo(() => {
    if (!allEntries || allEntries.length === 0) return [];
    const grouped = new Map<string, Record<string, number | string>>();
    const sorted = [...allEntries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    for (const e of sorted) {
      const day = new Date(e.createdAt).toLocaleDateString(
        i18n.language === "ru" ? "ru-RU" : "en-US",
        {
          month: "short",
          day: "numeric",
        },
      );
      const name = paramMap.get(e.parameterId) ?? e.parameterId;
      if (!grouped.has(day)) grouped.set(day, { date: day });
      const row = grouped.get(day)!;
      row[name] = e.value;
    }
    return Array.from(grouped.values());
  }, [allEntries, paramMap, i18n.language]);

  const { weeklyAverages, wellbeing } = useMemo(() => {
    if (!allEntries)
      return { weeklyAverages: [], wellbeing: { average: null, trend: "flat" as const } };
    const range = getDateRange(period);
    const currentStart = range.from ? new Date(range.from).getTime() : 0;
    const currentEnd = range.to ? new Date(range.to).getTime() : Date.now();
    const periodMs = currentEnd - currentStart;
    const prevStart = new Date(currentStart - periodMs).getTime();
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
      let trend: "up" | "down" | "flat" = "flat";
      if (current !== null && previous !== null) {
        trend = current > previous ? "up" : current < previous ? "down" : "flat";
      }
      return { name, average: current, previous, trend, visible: true };
    });

    const wellbeingScore = (getValue: (name: string) => number | null) => {
      const values: number[] = [];
      for (const name of ["Mood", "Energy", "Sleep"]) {
        const v = getValue(name);
        if (v !== null) values.push(v);
      }
      const anxiety = getValue("Anxiety");
      if (anxiety !== null) values.push(10 - anxiety);
      return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
    };
    const currentByName = new Map(perParam.map((p) => [p.name, p.average]));
    const previousByName = new Map(perParam.map((p) => [p.name, p.previous]));
    const wellbeingCurrent = wellbeingScore((name) => currentByName.get(name) ?? null);
    const wellbeingPrevious = wellbeingScore((name) => previousByName.get(name) ?? null);
    let wellbeingTrend: "up" | "down" | "flat" = "flat";
    if (wellbeingCurrent !== null && wellbeingPrevious !== null) {
      wellbeingTrend =
        wellbeingCurrent > wellbeingPrevious
          ? "up"
          : wellbeingCurrent < wellbeingPrevious
            ? "down"
            : "flat";
    }

    return {
      weeklyAverages: perParam.map(({ name, average, trend, visible }) => ({
        name,
        average,
        trend,
        visible,
      })),
      wellbeing: { average: wellbeingCurrent, trend: wellbeingTrend },
    };
  }, [allEntries, period, paramNames, paramMap, entriesByParam]);

  const gratitudeStats = useMemo(() => {
    const weekCount = (gratitudeAllEntries ?? []).filter((e) =>
      isWithinLastDays(e.createdAt, 7),
    ).length;
    return { weekCount };
  }, [gratitudeAllEntries]);

  const testAbbrMap = useMemo(() => {
    const map = new Map<string, string>();
    if (tests) {
      for (const test of tests) {
        const key = TEST_ABBR_KEYS[test.title];
        map.set(test.id, key ? t(key) : test.title.slice(0, 8));
      }
    }
    return map;
  }, [tests, t]);

  const testTimeline = useMemo(() => {
    if (!testResults) return [];
    const grouped = new Map<string, TestResult[]>();
    for (const r of testResults) {
      if (!grouped.has(r.testId)) grouped.set(r.testId, []);
      grouped.get(r.testId)!.push(r);
    }
    return Array.from(grouped.entries()).map(([testId, results]) => {
      const sorted = results.sort(
        (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
      );
      const last = sorted[sorted.length - 1];
      return {
        testId,
        label: testAbbrMap.get(testId) ?? testId.slice(0, 8),
        results: sorted,
        lastScore: last.score,
      };
    });
  }, [testResults, testAbbrMap]);

  const radarData: DistortionEntry[] = useMemo(() => {
    const cdResult = testResults?.find(
      (r) => (r.flags as Record<string, unknown> | undefined)?.distortions,
    );
    const cdDistortions = (
      cdResult?.flags as Record<string, Record<string, { score: number }>> | undefined
    )?.distortions;
    return cdDistortions
      ? Object.entries(cdDistortions).map(([key, val]) => ({ key, score: val.score }))
      : [];
  }, [testResults]);

  return {
    numericParams,
    trendData,
    paramNames,
    wellbeing,
    weeklyAverages,
    entriesByParam,
    creatureState,
    radarData,
    testTimeline,
    createEntry,
    gratitudeStats,
    isDataLoading: entriesLoading || resultsLoading,
    resultsLoading,
  };
}
