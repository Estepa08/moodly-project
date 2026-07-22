import { useTranslation } from "react-i18next";
import { Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface WellbeingCardProps {
  average: number | null;
  trend: "up" | "down" | "flat";
  isLoading: boolean;
}

export default function WellbeingCard({ average, trend, isLoading }: WellbeingCardProps) {
  const { t } = useTranslation();

  const colorClass = average !== null
    ? average >= 7 ? "text-primary" : average >= 4 ? "text-primary/70" : "text-primary/40"
    : "text-muted-foreground";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-primary" : trend === "down" ? "text-primary/50" : "text-muted-foreground";

  return (
    <Card className="shadow-neumorphic">
      <CardContent className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <Heart className="w-7 h-7 text-primary" />
          <span className="text-base font-medium text-foreground">{t("dashboard.wellbeing")}</span>
        </div>
        {isLoading ? (
          <span className="text-sm text-muted-foreground">{t("dashboard.practicesLoading")}</span>
        ) : (
          <div className="flex items-end gap-2">
            <span className={`text-5xl font-bold font-serif ${colorClass}`}>
              {average !== null ? average.toFixed(1) : "—"}
            </span>
            <TrendIcon className={`w-5 h-5 mb-2 ${trendColor}`} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
