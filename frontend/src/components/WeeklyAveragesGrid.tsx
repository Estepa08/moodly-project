import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { PARAM_ICONS, PARAM_NAME_KEYS, NEGATIVE_VALENCE_PARAMS } from "../lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import EmptyState from "./ui/empty-state";
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
          <div className="flex justify-center py-8">
            <Spinner size={32} />
          </div>
        ) : weeklyAverages.length === 0 ? (
          <EmptyState icon={BarChart3} title={t("dashboard.noAveragesYet")} />
        ) : (
          <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
            {weeklyAverages.map((avg) => {
              const Icon = PARAM_ICONS[avg.name];
              const averageValue = avg.average;
              const isNegative = NEGATIVE_VALENCE_PARAMS.has(avg.name);
              const goodness = averageValue === null ? null : isNegative ? 10 - averageValue : averageValue;
              const colorClass =
                goodness !== null
                  ? goodness >= 7
                    ? "text-primary"
                    : goodness >= 4
                      ? "text-primary/70"
                      : "text-primary/40"
                  : "text-muted-foreground";
              const TrendIcon =
                avg.trend === "up" ? TrendingUp : avg.trend === "down" ? TrendingDown : Minus;
              const trendIsGood =
                avg.trend === "flat" ? null : isNegative ? avg.trend === "down" : avg.trend === "up";
              const trendColor =
                trendIsGood === null
                  ? "text-muted-foreground"
                  : trendIsGood
                    ? "text-primary"
                    : "text-primary/50";
              return (
                <div key={avg.name} className="rounded-xl bg-card shadow-neumorphic-sm p-3 max-sm:p-2">
                  <div className="flex items-center gap-2 mb-2">
                    {Icon && <Icon className="w-4 h-4 text-primary" />}
                    <span className="text-xs text-muted-foreground">
                      {t(PARAM_NAME_KEYS[avg.name] ?? avg.name)}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`text-2xl font-bold font-serif ${colorClass}`}>
                      {averageValue !== null ? averageValue.toFixed(1) : "—"}
                    </span>
                    {averageValue !== null && (
                      <TrendIcon className={`w-4 h-4 mb-1 ${trendColor}`} />
                    )}
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
