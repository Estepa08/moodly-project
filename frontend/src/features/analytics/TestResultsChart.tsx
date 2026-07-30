import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
import { ChartTooltip } from "../../lib/chart-tooltip";
import PeriodSelector from "../../components/ui/PeriodSelector";
import { formatChartDate } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";
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

    const testNames = [...new Set(filtered.map((r) => (r as any).testTitle ?? r.testId))];
    const grouped = new Map<string, Record<string, unknown>>();

    for (const r of filtered) {
      const day = formatChartDate(new Date(r.completedAt), i18n.language, showYear);
      const testName = (r as any).testTitle ?? r.testId;
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
    return [...new Set(results.map((r) => (r as any).testTitle ?? r.testId))];
  }, [results]);

  if (isLoading) return null;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          {t("testResults.scoreHistory")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <PeriodSelector
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            size="sm"
          />
        </div>
        {chartData.length > 1 && testNames.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--chart-tick))" />
              <YAxis fontSize={11} stroke="hsl(var(--chart-tick))" />
              <Tooltip
                content={
                  <ChartTooltip
                    formatLabel={(name, value) => `${name}: ${value}`}
                  />
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
              />
              {testNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={TEST_COLORS[i % TEST_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={BarChart3} title={t("testResults.noHistory")} />
        )}
      </CardContent>
    </Card>
  );
}
