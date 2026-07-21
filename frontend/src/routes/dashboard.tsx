import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Spinner from "../components/ui/spinner";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import RadarChart from "../components/RadarChart";
import type { DistortionEntry } from "../components/RadarChart";
import { Moon, Sun, Zap, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Test {
  id: string;
  title: string;
}

interface Parameter {
  id: string;
  name: string;
  description?: string;
  unit?: string;
}

interface Entry {
  id: string;
  parameterId: string;
  value: number;
  note?: string;
  createdAt: string;
}

interface TestResult {
  id: string;
  testId: string;
  score: number;
  interpretation: string;
  recommendation: string;
  flags?: {
    distortions?: Record<string, { score: number; level: string }>;
    templateKey?: string;
  };
  completedAt: string;
}

const PERIODS = [
  { key: "1w", labelKey: "dashboard.thisWeek", days: 7 },
  { key: "2w", labelKey: "dashboard.twoWeeks", days: 14 },
  { key: "1m", labelKey: "dashboard.oneMonth", days: 30 },
  { key: "3m", labelKey: "dashboard.threeMonths", days: 90 },
  { key: "all", labelKey: "dashboard.allTime", days: Infinity },
] as const;

const PARAM_COLORS: Record<string, string> = {
  Anxiety: "#8B5CF6",
  Sleep: "#6366f1",
  Mood: "#059669",
  Energy: "#f59e0b",
  Focus: "#ec4899",
};

const PARAM_ICONS: Record<string, typeof Sun> = {
  Sleep: Moon,
  Mood: Sun,
  Energy: Zap,
  Focus: Eye,
};

const PARAM_NAME_KEYS: Record<string, string> = {
  Anxiety: "dashboard.anxiety",
  Sleep: "dashboard.sleep",
  Mood: "dashboard.mood",
  Energy: "dashboard.energy",
  Focus: "dashboard.focus",
};

const SEVERITY_COLORS: Record<string, string> = {
  minimal: "#059669",
  mild: "#eab308",
  moderate: "#f97316",
  severe: "#ea1515",
};

const TEST_ABBR_KEYS: Record<string, string> = {
  "GAD-7": "tests.abbreviation.gad7",
  "Burns Anxiety Inventory": "tests.abbreviation.bai",
  "Burns Depression Checklist": "tests.abbreviation.bdc",
  "Cognitive Distortions Assessment": "tests.abbreviation.cd",
};

function getSeverity(score: number, interpretation: string): string {
  const lower = interpretation.toLowerCase();
  if (lower.includes("severe") || lower.includes("high")) return "severe";
  if (lower.includes("moderate") || lower.includes("mod")) return "moderate";
  if (lower.includes("mild")) return "mild";
  return "minimal";
}

function getDateRange(period: string): { from?: string; to?: string } {
  const p = PERIODS.find((x) => x.key === period);
  if (!p || p.days === Infinity) return {};
  const from = new Date(Date.now() - p.days * 24 * 60 * 60 * 1000).toISOString();
  return { from, to: new Date().toISOString() };
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [entryValue, setEntryValue] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [period, setPeriod] = useState("2w");
  const [visibleParams, setVisibleParams] = useState<Set<string>>(new Set(["Mood", "Sleep", "Anxiety"]));

  const { data: params, isLoading: paramsLoading } = useQuery<Parameter[]>({
    queryKey: ["parameters"],
    queryFn: () => api.parameters.list() as Promise<Parameter[]>,
  });

  const { data: allEntries, isLoading: entriesLoading } = useQuery<Entry[]>({
    queryKey: ["entries", period],
    queryFn: () => {
      const range = getDateRange(period);
      return api.entries.list(range) as Promise<Entry[]>;
    },
  });

  const { data: testResults, isLoading: resultsLoading } = useQuery<TestResult[]>({
    queryKey: ["testResults"],
    queryFn: () => api.testResults.list() as Promise<TestResult[]>,
  });

  const { data: tests } = useQuery<Test[]>({
    queryKey: ["tests"],
    queryFn: () => api.tests.list() as Promise<Test[]>,
  });

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

  const cdResult = testResults?.find((r) => r.flags?.distortions);
  const cdDistortions = cdResult?.flags?.distortions;
  const radarData: DistortionEntry[] = cdDistortions
    ? Object.entries(cdDistortions).map(([key, val]) => ({ key, score: val.score }))
    : [];

  const paramMap = useMemo(() => {
    const map = new Map<string, string>();
    if (params) {
      for (const p of params) map.set(p.id, p.name);
    }
    return map;
  }, [params]);

  const paramNames = useMemo(() => {
    if (!params) return ["Anxiety", "Sleep", "Mood", "Energy", "Focus"];
    return params.map((p) => p.name);
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

  const testTimeline = useMemo(() => {
    if (!testResults || !params) return [];
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
        return {
          testId,
          label: testAbbrMap.get(testId) ?? testId.slice(0, 8),
          results: sorted,
          lastSeverity: getSeverity(last.score, last.interpretation),
          lastScore: last.score,
        };
      });
  }, [testResults, params, testAbbrMap]);

  const today = new Date().toDateString();
  const entriesForHistory = selectedParam ? (allEntries?.filter((e) => e.parameterId === selectedParam) ?? []) : [];

  const createEntry = useMutation({
    mutationFn: () =>
      api.entries.create({
        parameterId: selectedParam,
        value: parseFloat(entryValue),
        note: entryNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setEntryValue("");
      setEntryNote("");
      toast.success(t("dashboard.entrySaved"));
    },
  });

  const toggleParam = (name: string) => {
    setVisibleParams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const loading = paramsLoading || entriesLoading || resultsLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary font-serif">{t("dashboard.dateRange")}</h2>
        <div className="flex items-center gap-1 bg-card rounded-xl shadow-neumorphic-sm p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
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

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.parameterTrends")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size={32} /></div>
          ) : trendData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" fontSize={10} stroke="#a1a1aa" />
                  <YAxis domain={[0, 10]} fontSize={10} stroke="#a1a1aa" />
                  <Tooltip formatter={(value: number, name: string) => [value, t(PARAM_NAME_KEYS[name] ?? name)]} />
                  {paramNames.map((name) =>
                    visibleParams.has(name) ? (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={PARAM_COLORS[name] ?? "#8B5CF6"}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ) : null,
                  )}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3">
                {paramNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleParam(name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      visibleParams.has(name)
                        ? "bg-primary/10 text-primary shadow-neumorphic-sm"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PARAM_COLORS[name] ?? "#8B5CF6" }}
                    />
                    {t(PARAM_NAME_KEYS[name] ?? name)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noTrendData")}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.quickEntry")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dashboard.parameter")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-neumorphic-inset"
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value)}
              >
                <option value="">{t("dashboard.select")}</option>
                {params?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(PARAM_NAME_KEYS[p.name] ?? p.name)}{p.unit ? ` (${p.unit})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.value")}</Label>
              <Input
                type="number"
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                placeholder={t("dashboard.valuePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.note")}</Label>
              <Input
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
                placeholder={t("dashboard.notePlaceholder")}
              />
            </div>
            <Button
              className="w-full"
              disabled={!selectedParam || !entryValue || createEntry.isPending}
              onClick={() => createEntry.mutate()}
            >
              {createEntry.isPending ? t("common.saving") : t("dashboard.saveEntry")}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.weeklyAverages")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Spinner size={32} /></div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {weeklyAverages.map((avg) => {
                  const Icon = PARAM_ICONS[avg.name];
                  const avgValue = avg.average;
                  const colorClass = avgValue !== null
                    ? avgValue >= 7 ? "text-accent" : avgValue >= 4 ? "text-primary" : "text-destructive"
                    : "text-muted-foreground";
                  const TrendIcon = avg.trend === "up" ? TrendingUp : avg.trend === "down" ? TrendingDown : Minus;
                  const trendColor = avg.trend === "up" ? "text-accent" : avg.trend === "down" ? "text-destructive" : "text-muted-foreground";
                  return (
                    <div key={avg.name} className="rounded-xl bg-card shadow-neumorphic-sm p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {Icon && <Icon className="w-4 h-4 text-primary" />}
                        <span className="text-xs text-muted-foreground">{t(PARAM_NAME_KEYS[avg.name] ?? avg.name)}</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className={`text-2xl font-bold font-serif ${colorClass}`}>
                          {avgValue !== null ? avgValue.toFixed(1) : "—"}
                        </span>
                        <TrendIcon className={`w-4 h-4 mb-1 ${trendColor}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.testProgress")}</CardTitle>
        </CardHeader>
        <CardContent>
          {resultsLoading ? (
            <div className="flex justify-center py-8"><Spinner size={32} /></div>
          ) : testTimeline.length > 0 ? (
            <div className="space-y-4">
              {testTimeline.map((group) => {
                const severityColor = SEVERITY_COLORS[group.lastSeverity] ?? "#8B5CF6";
                return (
                  <div key={group.testId} className="flex items-center gap-3">
                    <div className="w-10 text-xs font-semibold text-muted-foreground shrink-0">
                      {group.label}
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
                      {group.results.map((r, idx) => {
                        const sev = getSeverity(r.score, r.interpretation);
                        const color = SEVERITY_COLORS[sev] ?? "#8B5CF6";
                        return (
                          <div key={r.id} className="flex items-center gap-0">
                            <div
                              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                                idx === group.results.length - 1
                                  ? "shadow-neumorphic-sm scale-110"
                                  : ""
                              }`}
                              style={{
                                backgroundColor: `${color}50`,
                                borderColor: color,
                              }}
                              title={`${r.score} — ${r.interpretation}`}
                            />
                            {idx < group.results.length - 1 && (
                              <div className="w-3 h-0.5 bg-border" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs font-medium shrink-0" style={{ color: severityColor }}>
                      {group.lastScore}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noTestData")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedParam ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.select")}</p>
          ) : entriesLoading ? (
            <div className="flex justify-center py-8"><Spinner size={32} /></div>
          ) : entriesForHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={entriesForHistory.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
                  fontSize={10}
                  stroke="#a1a1aa"
                />
                <YAxis fontSize={10} stroke="#a1a1aa" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8B5CF6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noEntries")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
