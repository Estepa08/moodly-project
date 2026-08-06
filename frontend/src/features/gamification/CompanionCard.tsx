import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap, Waves, Flame, Sparkles, Activity } from "lucide-react";
import { useCreatureState, usePets } from "./useCreature";
import { PET_DEFINITIONS } from "./pets";
import { EXP_PER_LEVEL } from "../../lib/constants";
import { ProgressBar } from "../../components/ui/progress-bar";
import PetAvatar from "./PetAvatar";

export default function CompanionCard() {
  const { t } = useTranslation();
  const { data: creature, isLoading } = useCreatureState();
  const { data: pets } = usePets();

  if (isLoading || !creature) return null;

  const activePetType = pets?.activePetType ?? creature.petType ?? "puff";
  const petName = pets?.petName ?? creature.petName ?? null;
  const definition = PET_DEFINITIONS.find((p) => p.type === activePetType);
  const displayName = petName?.trim() || (definition ? t(definition.labelKey) : "");

  const petMood = creature.petMood ?? "calm";
  const stage = creature.stage ?? "baby";

  const nextLevelExp = creature.level * EXP_PER_LEVEL;
  const expPercent = Math.min(100, Math.round((creature.experience / nextLevelExp) * 100));

  return (
    <section
      aria-label={displayName}
      className="bg-card rounded-xl shadow-neumorphic p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <PetAvatar
          petType={activePetType}
          interactive
          ariaLabel={displayName}
          emotion={petMood === "happy" ? "happy" : "idle"}
        />
        <div className="min-w-0 flex-1">
          <p className="font-serif font-semibold text-foreground text-lg leading-tight truncate">
            {displayName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {t("companion.level", { level: creature.level })}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-xs font-semibold text-warning">
              <Flame aria-hidden="true" className="w-3 h-3" />
              {creature.streak}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-xs font-semibold text-accent">
              <Sparkles aria-hidden="true" className="w-3 h-3" />
              {t(`petStage.${stage}`)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t("companion.xpToLevel", { level: creature.level + 1 })}
          </span>
          <span className="text-xs text-muted-foreground font-semibold tabular-nums">
            {creature.experience}/{nextLevelExp}
          </span>
        </div>
        <ProgressBar
          segments={[
            {
              value: expPercent,
              className:
                "rounded-full bg-primary shadow-neumorphic-sm transition-[width] duration-300",
            },
          ]}
          height={6}
          trackClassName="bg-muted"
          className="mt-1.5"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
          <span aria-hidden="true" className="text-sm leading-none">
            <Activity aria-hidden="true" className="w-3.5 h-3.5" />
          </span>
          {t(`petMood.${petMood}`)}
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-xs font-semibold text-accent">
          <Zap aria-hidden="true" className="w-3.5 h-3.5" />
          {t("companion.energy", { value: creature.energy })}
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
          <Waves aria-hidden="true" className="w-3.5 h-3.5" />
          {t("companion.calmness", { value: creature.calmness })}
        </span>
      </div>

      <div className="pt-2 border-t border-border">
        <Link
          to="/progress"
          className="flex items-center justify-between text-sm font-medium text-primary transition-[color,transform] duration-150 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          {t("companion.toCollection")}
          <span aria-hidden="true" className="text-base leading-none">
            ›
          </span>
        </Link>
      </div>
    </section>
  );
}
