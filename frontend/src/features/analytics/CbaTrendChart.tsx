import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Scale } from "lucide-react";
import { ChartTooltip } from "../../lib/chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";
import type { CbaEntry } from "../cost-benefit-analysis/cba.types";

interface CbaTrendChartProps {
  entries: CbaEntry[];
}

export default function CbaTrendChart({ entries }: CbaTrendChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const sorted = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return sorted.map((e, i) => ({
      name: `#${i + 1}`,
      Pros: e.prosWeight,
      Cons: e.consWeight,
      thought: e.thoughtText,
    }));
  }, [entries]);

  const overallBalance = useMemo(() => {
    if (!chartData.length) return null;
    const totalPros = chartData.reduce((s, d) => s + d.Pros, 0);
    const totalCons = chartData.reduce((s, d) => s + d.Cons, 0);
    const grand = totalPros + totalCons;
    return grand > 0 ? Math.round((totalPros / grand) * 100) : 50;
  }, [chartData]);

  if (chartData.length === 0) return null;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale aria-hidden="true" className="w-4 h-4 text-primary" />
          {t("cba.trendTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--chart-tick))" />
                <YAxis fontSize={11} stroke="hsl(var(--chart-tick))" domain={[0, 10]} />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatLabel={(name, value, row) => {
                        const thought = (row?.thought as string) ?? "";
                        const truncated = thought.length > 40 ? thought.slice(0, 40) + "..." : thought;
                        return `${name}: ${value}${name === "Pros" ? " 👍" : " 👎"} ${truncated ? `— ${truncated}` : ""}`;
                      }}
                    />
                  }
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
                <Bar dataKey="Pros" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cons" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {overallBalance !== null && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t("cba.overallBalance")}: {overallBalance}% Pros / {100 - overallBalance}% Cons
              </p>
            )}
          </>
        ) : (
          <EmptyState icon={Scale} title={t("cba.addMoreEntries")} />
        )}
      </CardContent>
    </Card>
  );
}
