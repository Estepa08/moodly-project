import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { PARAM_COLORS, PARAM_NAME_KEYS } from "../lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import EmptyState from "./ui/empty-state";
import Spinner from "./ui/spinner";

interface ParameterTrendsChartProps {
  trendData: Record<string, number | string>[];
  paramNames: string[];
  isLoading: boolean;
}

const Y_DOMAIN: [number, number] = [0, 10];

const CustomTooltip = ({ active, payload, label }: any) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-card px-3 py-2 rounded-xl shadow-neumorphic-sm border border-border text-sm"
      role="tooltip"
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="font-medium" style={{ color: entry.color }}>
          {t(PARAM_NAME_KEYS[entry.name] ?? entry.name)}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function ParameterTrendsChart({
  trendData,
  paramNames,
  isLoading,
}: ParameterTrendsChartProps) {
  const { t } = useTranslation();
  const defaultParam = paramNames.includes("Mood") ? "Mood" : paramNames[0];
  const [visibleParams, setVisibleParams] = useState<Set<string>>(
    () => new Set(defaultParam ? [defaultParam] : []),
  );

  const toggleVisible = (name: string) => {
    setVisibleParams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const visibleHasData = trendData.some((row) =>
    [...visibleParams].some((p) => row[p] != null),
  );

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.parameterTrends")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size={32} />
          </div>
        ) : trendData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis
                  dataKey="date"
                  fontSize={11}
                  stroke="hsl(var(--chart-tick))"
                  interval={Math.max(1, Math.floor(trendData.length / 6))}
                />
                <YAxis domain={Y_DOMAIN} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <Tooltip content={<CustomTooltip />} />
                {paramNames
                  .filter((name) => visibleParams.has(name))
                  .map((name) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={PARAM_COLORS[name] ?? "hsl(var(--primary))"}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
            {visibleParams.size > 0 && !visibleHasData && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t("dashboard.noEntries")}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {paramNames.map((name) => (
                <button
                  key={name}
                  aria-pressed={visibleParams.has(name)}
                  onClick={() => toggleVisible(name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    visibleParams.has(name)
                      ? "bg-primary/10 text-primary shadow-neumorphic-sm ring-2 ring-primary/60"
                      : "bg-muted text-muted-foreground shadow-neumorphic-inset"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PARAM_COLORS[name] ?? "hsl(var(--primary))" }}
                  />
                  {t(PARAM_NAME_KEYS[name] ?? name)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon={BarChart3} title={t("dashboard.noTrendData")} />
        )}
      </CardContent>
    </Card>
  );
}
