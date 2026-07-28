import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";

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
        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden shadow-neumorphic-inset">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 shadow-neumorphic-sm"
            style={{ width: `${expPercent}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums leading-none font-medium">
          {experience}/{nextLevelExp}
        </span>
      </div>
    </div>
  );
}
