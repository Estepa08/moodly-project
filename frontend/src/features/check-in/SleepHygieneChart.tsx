import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Chart } from "../analytics";

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

  if (data.length < 2) return null;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("sleepHygiene.comparisonTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground pt-1">{t("sleepHygiene.comparisonHint")}</p>
      </CardHeader>
      <CardContent>
        <Chart
          type="line"
          noCard
          data={data as unknown as Record<string, unknown>[]}
          series={[
            { dataKey: "habits", color: "hsl(var(--accent))", label: t("sleepHygiene.comparisonHabits") },
            { dataKey: "sleep", color: "hsl(var(--param-sleep))", label: t("sleepHygiene.comparisonSleep") },
          ]}
          xKey="date"
          formatTooltip={(name, value, row) => {
            const label =
              name === "habits"
                ? t("sleepHygiene.comparisonHabits")
                : t("sleepHygiene.comparisonSleep");
            const entryValues = (row?._values as Record<string, number[]> | undefined)?.[name];
            if (entryValues && entryValues.length > 1) {
              return `${label}: ${(value as number).toFixed(1)} (${entryValues.join(", ")})`;
            }
            return `${label}: ${value}`;
          }}
          height={160}
          showLegend
          showDots={false}
        />
      </CardContent>
    </Card>
  );
}
