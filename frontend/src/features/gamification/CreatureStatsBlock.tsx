import { useTranslation } from "react-i18next";
import { Calendar, Flame, Sparkles, Brain, Zap, Activity, UtensilsCrossed } from "lucide-react";
import type { CreatureStats } from "../../lib/api";
import BulletStat from "../../components/ui/bullet-stat";

interface CreatureStatsBlockProps {
  stats: CreatureStats;
}

export default function CreatureStatsBlock({ stats }: CreatureStatsBlockProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <BulletStat
        icon={Sparkles}
        label={t("progress.totalXp")}
        value={stats.totalXp}
        target={1000}
        color="hsl(var(--accent))"
      />
      <BulletStat
        icon={Activity}
        label={t("progress.totalPractices")}
        value={stats.totalPractices}
        target={100}
        color="hsl(var(--primary))"
      />
      <BulletStat
        icon={Calendar}
        label={t("progress.totalCheckins")}
        value={stats.totalCheckins}
        target={90}
        color="hsl(142 71% 45%)"
      />
      <BulletStat
        icon={Flame}
        label={t("progress.streakDays")}
        value={stats.streak}
        target={30}
        color="hsl(24 95% 53%)"
      />
      <BulletStat
        icon={Brain}
        label={t("progress.calmness")}
        value={stats.calmness}
        target={100}
        unit="%"
        color="hsl(217 91% 60%)"
      />
      <BulletStat
        icon={Zap}
        label={t("progress.energy")}
        value={stats.energy}
        target={100}
        unit="%"
        color="hsl(45 93% 47%)"
      />
      <BulletStat
        icon={UtensilsCrossed}
        label={t("progress.feedsTotal")}
        value={stats.feedCount ?? 0}
        target={1000}
        color="hsl(38 92% 50%)"
      />
    </div>
  );
}
