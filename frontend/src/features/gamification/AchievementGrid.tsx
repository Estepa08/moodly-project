import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  Trophy,
  Lock,
  Check,
  Star,
  Target,
  Brain,
  Heart,
  Moon,
  Flame,
  HelpCircle,
  Medal,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAchievements } from "./useCreature";
import type { Achievement } from "../../lib/api";
import { TITLE_MAP, TITLE_EMOJI } from "./TitleSelector";

const CATEGORY_ICONS: Record<string, typeof Trophy> = {
  general: Star,
  streak: Flame,
  practices: Brain,
  level: Target,
  breathing: Heart,
  mindfulness: Moon,
  hidden: HelpCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "text-accent",
  streak: "text-warning",
  practices: "text-primary",
  level: "text-success",
  breathing: "text-info",
  mindfulness: "text-primary",
  hidden: "text-muted-foreground",
};

const isHidden = (a: Achievement) => a.category === "hidden";

export default function AchievementGrid() {
  const { t } = useTranslation();
  const { data: achievements, isLoading } = useAchievements();
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted/50 animate-pulse h-28" />
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

  const withProgress = achievements.filter(
    (a) => !isHidden(a) && (a.unlocked || a.progress > 0),
  );
  const hidden = achievements.filter((a) => isHidden(a));
  const rest = achievements.filter((a) => !isHidden(a) && !a.unlocked && a.progress === 0);

  const rendered = withProgress.concat(hidden).concat(showAll ? rest : []);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {rendered.map((a) => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>
      {!showAll && rest.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl p-2.5 text-sm font-semibold text-foreground bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.99] transition-[box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("progress.showAllAchievements", { count: rest.length })}
        </button>
      )}
    </div>
  );
}

function AchievementCard({ achievement: a }: { achievement: Achievement }) {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICONS[a.category] ?? Trophy;
  const colorClass = CATEGORY_COLORS[a.category] ?? "text-muted-foreground";
  const hidden = isHidden(a) && !a.unlocked;

  return (
    <div
      className={cn(
        "rounded-xl p-3 flex flex-col gap-1.5 transition-[background-color,box-shadow] duration-150 min-h-[128px]",
        a.unlocked || a.progress > 0 || hidden
          ? "bg-card shadow-neumorphic-sm"
          : "bg-muted/30",
        hidden && "border border-dashed",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center",
            a.unlocked
              ? `${CATEGORY_COLORS[a.category] ?? "text-primary"}/10`
              : hidden
                ? "bg-muted/60"
                : "bg-muted",
          )}
        >
          {a.unlocked ? (
            <Icon aria-hidden="true" className={cn("w-3.5 h-3.5", colorClass)} />
          ) : (
            <Lock aria-hidden="true" className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
        {a.unlocked && (
          <Check aria-hidden="true" className="w-3.5 h-3.5 text-success shrink-0" />
        )}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-semibold truncate",
            a.unlocked || !hidden ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {hidden ? t("progress.mysteryHint") : t(a.titleKey)}
        </p>
        <p className="text-[11px] leading-tight mt-0.5 line-clamp-2 text-muted-foreground">
          {t(a.descKey)}
        </p>
      </div>
      {a.titleReward && !hidden && (
        <div className="inline-flex items-center gap-1 self-start rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          <Medal aria-hidden="true" className="w-3 h-3 shrink-0" />
          <span className="truncate">{TITLE_EMOJI[a.titleReward] ?? "🎖️"} {t(TITLE_MAP[a.titleReward] ?? a.titleReward)}</span>
        </div>
      )}
      {!a.unlocked && !hidden && (
        <div className="mt-auto">
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${a.progress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{a.progress}%</p>
        </div>
      )}
    </div>
  );
}