import { useTranslation } from "react-i18next";
import { Trophy, Lock, Check, Star, Target, Brain, Heart, Moon, Flame } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAchievements } from "./useCreature";

const CATEGORY_ICONS: Record<string, typeof Trophy> = {
  general: Star,
  streak: Flame,
  practices: Brain,
  level: Target,
  breathing: Heart,
  mindfulness: Moon,
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "text-accent",
  streak: "text-orange-500",
  practices: "text-primary",
  level: "text-green-500",
  breathing: "text-blue-500",
  mindfulness: "text-purple-500",
};

export default function AchievementGrid() {
  const { t } = useTranslation();
  const { data: achievements, isLoading } = useAchievements();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted/50 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        {t("progress.noAchievementsYet")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {achievements.map((a) => {
        const Icon = CATEGORY_ICONS[a.category] ?? Trophy;
        const colorClass = CATEGORY_COLORS[a.category] ?? "text-muted-foreground";
        return (
          <div
            key={a.id}
            className={cn(
              "rounded-xl p-3 flex flex-col gap-1.5 transition-[background-color,box-shadow] duration-150",
              a.unlocked
                ? "bg-card shadow-neumorphic-sm"
                : a.progress > 0
                  ? "bg-card/80 shadow-neumorphic-sm"
                  : "bg-muted/30",
            )}
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  a.unlocked ? `${CATEGORY_COLORS[a.category] ?? "text-primary"}/10` : "bg-muted",
                )}
              >
                {a.unlocked ? (
                  <Icon aria-hidden="true" className={cn("w-3.5 h-3.5", colorClass)} />
                ) : (
                  <Lock aria-hidden="true" className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              {a.unlocked && (
                <Check aria-hidden="true" className="w-3.5 h-3.5 text-green-500 shrink-0" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold truncate",
                  a.unlocked ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t(a.titleKey)}
              </p>
              <p
                className={cn(
                  "text-[10px] leading-tight mt-0.5",
                  a.unlocked ? "text-muted-foreground" : "text-muted-foreground/60",
                )}
              >
                {t(a.descKey)}
              </p>
            </div>
            {!a.unlocked && (
              <div className="mt-1">
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.progress}%</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
