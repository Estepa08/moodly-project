import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry } from "../hooks/useEntries";
import { useTests, useTestResults } from "../hooks/useTests";
import type { components } from "../lib/api-types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import RadarChart from "../components/RadarChart";
import type { DistortionEntry } from "../components/RadarChart";
import DashboardQuickEntry from "../components/DashboardQuickEntry";
import ParameterTrendsChart from "../components/ParameterTrendsChart";
import WeeklyAveragesGrid from "../components/WeeklyAveragesGrid";
import TestTimeline from "../components/TestTimeline";
import EntryHistory from "../components/EntryHistory";

type Entry = components["schemas"]["Entry"];
type TestResult = components["schemas"]["TestResult"];

const PERIODS = [
  { key: "1w", labelKey: "dashboard.thisWeek", days: 7 },
  { key: "2w", labelKey: "dashboard.twoWeeks", days: 14 },
  { key: "1m", labelKey: "dashboard.oneMonth", days: 30 },
  { key: "3m", labelKey: "dashboard.threeMonths", days: 90 },
  { key: "all", labelKey: "dashboard.allTime", days: Infinity },
] as const;

const TEST_ABBR_KEYS: Record<string, string> = {
  "GAD-7": "tests.abbreviation.gad7",
  "Burns Anxiety Inventory": "tests.abbreviation.bai",
  "Burns Depression Checklist": "tests.abbreviation.bdc",
  "Cognitive Distortions Assessment": "tests.abbreviation.cd",
};

function getDateRange(period: string): { from?: string; to?: string } {
  const p = PERIODS.find((x) => x.key === period);
  if (!p || p.days === Infinity) return {};
  const from = new Date(Date.now() - p.days * 24 * 60 * 60 * 1000).toISOString();
  return { from, to: new Date().toISOString() };
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [moodValue, setMoodValue] = useState([7.5]);
  const [period, setPeriod] = useState("2w");
  const [visibleParams, setVisibleParams] = useState<Set<string>>(new Set(["Mood", "Sleep", "Anxiety"]));

  const { data: params } = useParameters();
  const { data: allEntries, isLoading: entriesLoading } = useEntries(getDateRange(period));
  const { data: testResults, isLoading: resultsLoading } = useTestResults();
  const { data: tests } = useTests();
  const createEntry = useCreateEntry();

  const paramNames = useMemo(() => {
    if (!params) return ["Anxiety", "Sleep", "Mood", "Energy", "Focus"];
    return params.map((p) => p.name);
  }, [params]);

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
      const day = new Date(e.createdAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US", {
        month: "short",
        day: "numeric",
      });
      const name = paramMap.get(e.parameterId) ?? e.parameterId;
      if (!grouped.has(day)) grouped.set(day, { date: day });
      const row = grouped.get(day)!;
      row[name] = e.value;
    }
    return Array.from(grouped.values());
  }, [allEntries, paramMap, i18n.language]);

  const weeklyAverages = useMemo(() => {
    if (!allEntries) return [];
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

    return paramNames.map((name) => {
      let id = "";
      for (const [pid, pname] of paramMap) {
        if (pname === name) { id = pid; break; }
      }
      const paramEntries = id ? (entriesByParam.get(name) ?? []) : [];
      const current = calcAvg(paramEntries, currentStart, currentEnd);
      const previous = calcAvg(paramEntries, prevStart, prevEnd);
      let trend: "up" | "down" | "flat" = "flat";
      if (current !== null && previous !== null) {
        trend = current > previous ? "up" : current < previous ? "down" : "flat";
      }
      return { name, average: current, trend, visible: true };
    });
  }, [allEntries, period, paramNames, paramMap, entriesByParam]);

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
    return Array.from(grouped.entries())
      .map(([testId, results]) => {
        const sorted = results.sort(
          (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime(),
        );
        const last = sorted[sorted.length - 1];
        const lower = last.interpretation.toLowerCase();
        const lastSeverity = lower.includes("severe") || lower.includes("high") ? "severe"
          : lower.includes("moderate") || lower.includes("mod") ? "moderate"
          : lower.includes("mild") ? "mild" : "minimal";
        return {
          testId,
          label: testAbbrMap.get(testId) ?? testId.slice(0, 8),
          results: sorted,
          lastSeverity,
          lastScore: last.score,
        };
      });
  }, [testResults, testAbbrMap]);

  const cdResult = testResults?.find((r) => (r.flags as Record<string, unknown> | undefined)?.distortions);
  const cdDistortions = (cdResult?.flags as Record<string, Record<string, { score: number }>> | undefined)?.distortions;
  const radarData: DistortionEntry[] = cdDistortions
    ? Object.entries(cdDistortions).map(([key, val]) => ({ key, score: val.score }))
    : [];

  const entriesForHistory = selectedParam ? (allEntries?.filter((e) => e.parameterId === selectedParam) ?? []) : [];
  const loading = entriesLoading || resultsLoading;

  const toggleParam = (name: string) => {
    setVisibleParams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground font-serif">{t("dashboard.dateRange")}</h2>
        <div className="flex items-center gap-1 bg-card rounded-xl shadow-neumorphic-sm p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              aria-pressed={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                period === p.key
                  ? "bg-primary text-primary-foreground shadow-neumorphic-sm"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <DashboardQuickEntry
        params={params}
        selectedParam={selectedParam}
        onParamChange={setSelectedParam}
        moodValue={moodValue}
        onMoodChange={setMoodValue}
        createEntry={createEntry}
      />

      <ParameterTrendsChart
        trendData={trendData}
        paramNames={paramNames}
        visibleParams={visibleParams}
        onToggleParam={toggleParam}
        loading={loading}
      />

      <WeeklyAveragesGrid
        weeklyAverages={weeklyAverages}
        loading={loading}
      />

      {radarData.length > 0 && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.cdProfile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart data={radarData} />
          </CardContent>
        </Card>
      )}

      <TestTimeline
        testTimeline={testTimeline}
        loading={resultsLoading}
      />

      <EntryHistory
        selectedParam={selectedParam}
        entries={entriesForHistory}
        loading={entriesLoading}
      />
    </div>
  );
}
