import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Scale } from "lucide-react";
import { Chart } from "../../lib/chart";
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

  const needsTwoPoints = chartData.length > 1;

  if (chartData.length === 0) return null;

  return (
    <Chart
      type="bar"
      data={needsTwoPoints ? chartData : []}
      series={[
        { dataKey: "Pros", color: "hsl(var(--accent))", label: "Pros" },
        { dataKey: "Cons", color: "hsl(var(--destructive))", label: "Cons" },
      ]}
      xKey="name"
      title={t("cba.trendTitle")}
      icon={<Scale aria-hidden="true" className="w-4 h-4 text-primary" />}
      emptyMessage={t("cba.addMoreEntries")}
      emptyIcon={Scale}
      formatTooltip={(name, value, row) => {
        const thought = (row?.thought as string) ?? "";
        const truncated = thought.length > 40 ? thought.slice(0, 40) + "..." : thought;
        return `${name}: ${value}${name === "Pros" ? " 👍" : " 👎"}${truncated ? `— ${truncated}` : ""}`;
      }}
      height={200}
      yDomain={[0, 10]}
      showLegend
      footer={
        overallBalance !== null && needsTwoPoints ? (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t("cba.overallBalance")}: {overallBalance}% Pros / {100 - overallBalance}% Cons
          </p>
        ) : undefined
      }
    />
  );
}
