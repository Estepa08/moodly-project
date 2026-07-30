import { useTranslation } from "react-i18next";
import { ProgressBar } from "../../components/ui/progress-bar";
import { cn } from "../../lib/utils";

interface CreatureStatusProps {
  level: number;
  experience: number;
  className?: string;
}

const EXP_PER_LEVEL = 100;

export default function CreatureStatus({
  level,
  experience,
  className,
}: CreatureStatusProps) {
  const { t } = useTranslation();
  const nextLevelExp = level * EXP_PER_LEVEL;
  const expPercent = Math.min(100, Math.round((experience / nextLevelExp) * 100));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="px-3 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary leading-tight">
        {t("creature.level", { level })}
      </div>
      <div className="flex items-center gap-1.5 min-w-[120px]">
        <ProgressBar
          segments={[{ value: expPercent, className: "rounded-full bg-primary shadow-neumorphic-sm transition-[width] duration-300" }]}
          height={2.5}
          trackClassName="bg-muted"
          className="flex-1"
        />
        <span className="text-[11px] text-muted-foreground tabular-nums leading-none font-medium">
          {experience}/{nextLevelExp}
        </span>
      </div>
    </div>
  );
}
