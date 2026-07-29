import { useTranslation } from "react-i18next";
import { Calendar, Flame, Sparkles, Brain, Zap, Activity } from "lucide-react";
import type { CreatureStats } from "../../lib/api";

interface CreatureStatsBlockProps {
  stats: CreatureStats;
}

export default function CreatureStatsBlock({ stats }: CreatureStatsBlockProps) {
  const { t } = useTranslation();

  const cards = [
    {
      icon: Sparkles,
      label: t("progress.totalXp"),
      value: stats.totalXp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Activity,
      label: t("progress.totalPractices"),
      value: stats.totalPractices,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Calendar,
      label: t("progress.totalCheckins"),
      value: stats.totalCheckins,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Flame,
      label: t("progress.streakDays"),
      value: stats.streak,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      icon: Brain,
      label: t("progress.calmness"),
      value: `${stats.calmness}%`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Zap,
      label: t("progress.energy"),
      value: `${stats.energy}%`,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl bg-card shadow-neumorphic-sm p-3 flex flex-col items-center gap-1"
          >
            <div className={`w-8 h-8 rounded-full ${card.bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <span className="text-lg font-bold text-foreground tabular-nums">{card.value}</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">{card.label}</span>
          </div>
        );
      })}
    </div>
  );
}
