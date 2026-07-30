import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import { Chart } from "../../lib/chart";
import { formatChartDate } from "../../lib/utils";
import type { components } from "../../lib/api-types";

type TestResult = components["schemas"]["TestResult"] & { testTitle?: string };

interface TestResultsChartProps {
  results: TestResult[];
  isLoading?: boolean;
}

const PERIOD_OPTIONS = [
  { key: "3m", label: "3m" },
  { key: "6m", label: "6m" },
  { key: "all", label: "All" },
];

const TEST_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--param-sleep))",
  "hsl(var(--param-energy))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
];

export default function TestResultsChart({ results, isLoading }: TestResultsChartProps) {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState("6m");

  const chartData = useMemo(() => {
    if (!results || results.length === 0) return [];

    const showYear = period === "all";
    const periodDays = period === "all" ? Infinity : parseInt(period) * 30;
    const cutoff = periodDays === Infinity ? 0 : Date.now() - periodDays * 24 * 60 * 60 * 1000;

    const filtered = results
      .filter((r) => new Date(r.completedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

    const testNames = [...new Set(filtered.map((r) => r.testTitle ?? r.testId))];
    const grouped = new Map<string, Record<string, unknown>>();

    for (const r of filtered) {
      const day = formatChartDate(new Date(r.completedAt), i18n.language, showYear);
      const testName = r.testTitle ?? r.testId;
      if (!grouped.has(day)) {
        const base: Record<string, unknown> = { date: day };
        for (const n of testNames) base[n] = null;
        grouped.set(day, base);
      }
      grouped.get(day)![testName] = r.score;
    }

    return Array.from(grouped.values());
  }, [results, i18n.language, period]);

  const testNames = useMemo(() => {
    if (!results) return [];
    return [...new Set(results.map((r) => r.testTitle ?? r.testId))];
  }, [results]);

  const needsChart = chartData.length > 1 && testNames.length > 0;

  return (
    <Chart
      type="line"
      data={needsChart ? chartData : []}
      series={testNames.map((name, i) => ({
        dataKey: name,
        color: TEST_COLORS[i % TEST_COLORS.length],
        label: name,
      }))}
      xKey="date"
      title={t("testResults.scoreHistory")}
      icon={<BarChart3 aria-hidden="true" className="w-4 h-4 text-primary" />}
      isLoading={isLoading}
      emptyMessage={t("testResults.noHistory")}
      emptyIcon={BarChart3}
      periodOptions={PERIOD_OPTIONS}
      period={period}
      onPeriodChange={setPeriod}
      formatTooltip={(name, value) => `${name}: ${value}`}
      height={220}
      showLegend
    />
  );
}
