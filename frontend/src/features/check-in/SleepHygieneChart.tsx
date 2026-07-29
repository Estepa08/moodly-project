import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { CorrelationChart } from "../analytics";

interface CorrelationDataPoint {
  date: string;
  habits?: number;
  sleep?: number;
}

interface SleepHygieneChartProps {
  data: CorrelationDataPoint[];
}

export default function SleepHygieneChart({ data }: SleepHygieneChartProps) {
  const { t } = useTranslation();
  const [showChart, setShowChart] = useState(false);

  if (data.length < 2) return null;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("sleepHygiene.comparisonTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground pt-1">{t("sleepHygiene.comparisonHint")}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          onClick={() => setShowChart(!showChart)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card shadow-neumorphic-sm text-xs font-medium text-muted-foreground cursor-pointer hover:text-primary transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {showChart ? t("sleepHygiene.hideChart") : t("sleepHygiene.showChart")}
        </button>
        {showChart && (
          <CorrelationChart
            data={data as unknown as Record<string, unknown>[]}
            lines={[
              { dataKey: "habits", stroke: "hsl(var(--accent))", label: t("sleepHygiene.comparisonHabits") },
              { dataKey: "sleep", stroke: "hsl(var(--param-sleep))", label: t("sleepHygiene.comparisonSleep") },
            ]}
            formatLabel={(name) => name === "habits" ? t("sleepHygiene.comparisonHabits") : t("sleepHygiene.comparisonSleep")}
          />
        )}
      </CardContent>
    </Card>
  );
}
