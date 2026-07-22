import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PARAM_ICONS, PARAM_NAME_KEYS } from "../lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Spinner from "./ui/spinner";

interface WeeklyAverage {
  name: string;
  average: number | null;
  trend: "up" | "down" | "flat";
}

interface WeeklyAveragesGridProps {
  weeklyAverages: WeeklyAverage[];
  isLoading: boolean;
}

export default function WeeklyAveragesGrid({ weeklyAverages, isLoading }: WeeklyAveragesGridProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.weeklyAverages")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner size={32} /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {weeklyAverages.map((avg) => {
              const Icon = PARAM_ICONS[avg.name];
              const averageValue = avg.average;
              const colorClass = averageValue !== null
                ? averageValue >= 7 ? "text-accent" : averageValue >= 4 ? "text-primary" : "text-destructive"
                : "text-muted-foreground";
              const TrendIcon = avg.trend === "up" ? TrendingUp : avg.trend === "down" ? TrendingDown : Minus;
              const trendColor = avg.trend === "up" ? "text-accent" : avg.trend === "down" ? "text-destructive" : "text-muted-foreground";
              return (
                <div key={avg.name} className="rounded-xl bg-card shadow-neumorphic-sm p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {Icon && <Icon className="w-4 h-4 text-primary" />}
                    <span className="text-xs text-muted-foreground">{t(PARAM_NAME_KEYS[avg.name] ?? avg.name)}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`text-2xl font-bold font-serif ${colorClass}`}>
                      {averageValue !== null ? averageValue.toFixed(1) : "—"}
                    </span>
                    <TrendIcon className={`w-4 h-4 mb-1 ${trendColor}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
