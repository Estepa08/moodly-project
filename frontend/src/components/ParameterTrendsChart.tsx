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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Spinner from "./ui/spinner";

const PARAM_COLORS: Record<string, string> = {
  Anxiety: "hsl(var(--primary))",
  Sleep: "hsl(var(--param-sleep))",
  Mood: "hsl(var(--accent))",
  Energy: "hsl(var(--param-energy))",
  Focus: "hsl(var(--param-focus))",
};

const PARAM_NAME_KEYS: Record<string, string> = {
  Anxiety: "dashboard.anxiety",
  Sleep: "dashboard.sleep",
  Mood: "dashboard.mood",
  Energy: "dashboard.energy",
  Focus: "dashboard.focus",
};

interface ParameterTrendsChartProps {
  trendData: Record<string, number | string>[];
  paramNames: string[];
  visibleParams: Set<string>;
  onToggleParam: (name: string) => void;
  loading: boolean;
}

export default function ParameterTrendsChart({
  trendData,
  paramNames,
  visibleParams,
  onToggleParam,
  loading,
}: ParameterTrendsChartProps) {
  const { t } = useTranslation();

  return (
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--chart-tick))" />
                <YAxis domain={[0, 10]} fontSize={10} stroke="hsl(var(--chart-tick))" />
                <Tooltip formatter={(value: number, name: string) => [value, t(PARAM_NAME_KEYS[name] ?? name)]} />
                {paramNames.map((name) =>
                  visibleParams.has(name) ? (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={PARAM_COLORS[name] ?? "hsl(var(--primary))"}
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
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noTrendData")}</p>
        )}
      </CardContent>
    </Card>
  );
}
