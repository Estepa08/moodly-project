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
import { PARAM_COLORS, PARAM_NAME_KEYS } from "../lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Spinner from "./ui/spinner";

interface ParameterTrendsChartProps {
  trendData: Record<string, number | string>[];
  paramNames: string[];
  visibleParams: Set<string>;
  onToggleParam: (name: string) => void;
  isLoading: boolean;
}

const Y_DOMAIN: [number, number] = [0, 10];

const CustomTooltip = ({ active, payload, label }: any) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card px-3 py-2 rounded-xl shadow-neumorphic-sm border border-border text-sm" role="tooltip">
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
  visibleParams,
  onToggleParam,
  isLoading,
}: ParameterTrendsChartProps) {
  const { t } = useTranslation();
  const [focusedParam, setFocusedParam] = useState<string | null>(null);

  const toggleFocus = (name: string) => {
    setFocusedParam((prev) => (prev === name ? null : name));
  };

  const focusedHasData = !focusedParam || trendData.some((row) => row[focusedParam] != null);

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.parameterTrends")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner size={32} /></div>
        ) : trendData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--chart-tick))" />
                <YAxis domain={Y_DOMAIN} fontSize={10} stroke="hsl(var(--chart-tick))" />
                <Tooltip content={<CustomTooltip />} />
                {paramNames.map((name) => {
                  if (!visibleParams.has(name)) return null;
                  const isFocused = name === focusedParam;
                  return (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={PARAM_COLORS[name] ?? "hsl(var(--primary))"}
                      strokeWidth={isFocused ? 3 : 1.5}
                      strokeOpacity={!focusedParam || isFocused ? 1 : 0.4}
                      dot={isFocused ? { r: 3 } : false}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            {focusedParam && !focusedHasData && (
              <p className="text-xs text-muted-foreground text-center mt-2">{t("dashboard.noEntries")}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {paramNames.map((name) => (
                <button
                  key={name}
                  aria-pressed={visibleParams.has(name)}
                  onClick={() => onToggleParam(name)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    visibleParams.has(name)
                      ? "bg-primary/10 text-primary shadow-neumorphic-sm"
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
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">{t("dashboard.highlight")}</p>
              <div className="flex flex-wrap gap-2">
                {paramNames.map((name) => (
                  <button
                    key={name}
                    aria-pressed={name === focusedParam}
                    onClick={() => toggleFocus(name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      name === focusedParam
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
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noTrendData")}</p>
        )}
      </CardContent>
    </Card>
  );
}
