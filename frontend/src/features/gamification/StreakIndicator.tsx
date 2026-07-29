import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";
import { cn } from "../../lib/utils";

interface StreakIndicatorProps {
  streak: number;
  className?: string;
}

export default function StreakIndicator({ streak, className }: StreakIndicatorProps) {
  const { t } = useTranslation();

  if (streak <= 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-full bg-card shadow-elevation-inset text-xs font-medium transition-all duration-150",
        streak >= 7 ? "text-accent" : "text-muted-foreground",
        className,
      )}
      title={t("dailyCheckIn.streak", { count: streak })}
    >
      <Flame className={cn("w-3.5 h-3.5", streak >= 7 && "text-accent")} />
      <span>{streak}</span>
    </div>
  );
}
