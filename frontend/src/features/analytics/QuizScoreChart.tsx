import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";
import { Chart } from "../../lib/chart";
import { formatChartDate } from "../../lib/utils";
import type { components } from "../../lib/api-types";

type Entry = components["schemas"]["Entry"];

interface QuizScoreChartProps {
  entries: Entry[];
  isLoading?: boolean;
}

const PERIOD_OPTIONS = [
  { key: "5", label: "5" },
  { key: "10", label: "10" },
  { key: "all", label: "All" },
];

export default function QuizScoreChart({ entries, isLoading }: QuizScoreChartProps) {
  const { t, i18n } = useTranslation();
  const [limit, setLimit] = useState("10");

  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const maxPoints = limit === "all" ? Infinity : parseInt(limit);
    const sorted = [...entries]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-maxPoints);

    const getTotal = (note?: string | null) => {
      if (!note) return 10;
      const parts = note.split("/");
      return parseInt(parts[1]) || 10;
    };

    const grouped = new Map<string, { score: number; total: number; count: number }>();
    for (const e of sorted) {
      const day = formatChartDate(new Date(e.createdAt), i18n.language, false);
      const total = getTotal(e.note);
      if (!grouped.has(day)) grouped.set(day, { score: 0, total, count: 0 });
      const g = grouped.get(day)!;
      g.score += e.value;
      g.total = total;
      g.count += 1;
    }

    return Array.from(grouped.entries()).map(([date, g]) => ({
      date,
      Score: g.count > 1 ? Math.round((g.score / g.count) * 100) / 100 : g.score,
      total: g.total,
      count: g.count,
    }));
  }, [entries, i18n.language, limit]);

  const recentAvg = useMemo(() => {
    if (!chartData.length) return null;
    const scores = chartData.map((d) => d.Score as number);
    return scores.reduce((s, v) => s + v, 0) / scores.length;
  }, [chartData]);

  const yMax = useMemo(() => {
    if (!chartData.length) return 10;
    const max = Math.max(...chartData.map((d) => d.Score as number));
    return Math.max(10, Math.ceil(max));
  }, [chartData]);

  const needsTwoPoints = chartData.length > 1;

  return (
    <Chart
      type="line"
      data={needsTwoPoints ? chartData : []}
      series={[{ dataKey: "Score", color: "hsl(var(--primary))", label: "Score" }]}
      xKey="date"
      title={t("distortions.quizHistory")}
      icon={<BarChart3 aria-hidden="true" className="w-4 h-4 text-primary" />}
      isLoading={isLoading}
      emptyMessage={t("distortions.noQuizHistory")}
      emptyIcon={BarChart3}
      periodOptions={PERIOD_OPTIONS}
      period={limit}
      onPeriodChange={setLimit}
      periodLabel="Attempts"
      formatTooltip={(name, value, row) => {
        const total = (row?.total as number) ?? 10;
        const count = (row?.count as number) ?? 1;
        const label = count > 1 ? `Score: ${value} (avg of ${count})` : `Score: ${value}`;
        return `${label} / ${total}`;
      }}
      height={200}
      yDomain={[0, yMax]}
      footer={
        recentAvg !== null && needsTwoPoints ? (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Average: {recentAvg.toFixed(1)} / {chartData[0]?.total ?? 10}
          </p>
        ) : undefined
      }
    />
  );
}
