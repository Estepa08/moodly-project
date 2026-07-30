import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { ChartTooltip } from "../../lib/chart-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";

interface DigestChartsProps {
  averages: Record<string, number>;
  practicesCompleted: Record<string, number>;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--param-sleep))",
  "hsl(var(--param-energy))",
  "hsl(var(--destructive))",
];

const PRACTICE_LABEL_KEYS: Record<string, string> = {
  breathing: "progress.activityBreathing",
  gratitude: "progress.activityGratitude",
  sleepHygiene: "progress.activitySleepHygiene",
  distortions: "progress.activityDistortions",
  cba: "progress.activityCba",
  thoughtJournal: "progress.activityThoughtJournal",
};

export default function DigestCharts({ averages, practicesCompleted }: DigestChartsProps) {
  const { t } = useTranslation();

  const avgChartData = useMemo(() => {
    return Object.entries(averages).map(([key, val]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: val,
    }));
  }, [averages]);

  const practiceChartData = useMemo(() => {
    return Object.entries(practicesCompleted).map(([key, val]) => ({
      name: t(PRACTICE_LABEL_KEYS[key] ?? key),
      value: val,
    }));
  }, [practicesCompleted, t]);

  const hasAverages = avgChartData.length > 0;
  const hasPractices = practiceChartData.length > 0;

  if (!hasAverages && !hasPractices) return null;

  return (
    <div className="space-y-4">
      {hasAverages && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("digest.averagesChartTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={avgChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--chart-tick))" />
                <YAxis domain={[0, 10]} fontSize={11} stroke="hsl(var(--chart-tick))" />
                <Tooltip content={<ChartTooltip formatLabel={(name, value) => `${name}: ${value}`} />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {hasPractices && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("digest.practicesChartTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {practiceChartData.length > 1 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie
                      data={practiceChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={30}
                    >
                      {practiceChartData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {practiceChartData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground flex-1">{entry.name}</span>
                      <span className="font-medium tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              practiceChartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground flex-1">{entry.name}</span>
                  <span className="font-medium">{entry.value}x</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
