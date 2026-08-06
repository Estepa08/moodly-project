import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useCreatureState, usePets } from "./useCreature";
import { PET_DEFINITIONS } from "./pets";
import PetAvatar from "./PetAvatar";
import { useDayPhase } from "../../hooks/useDayPhase";
import { useMessageOfDay } from "../../hooks/useMessageOfDay";
import { cn } from "../../lib/utils";

export default function PetGreeterCard({ onCheckIn }: { onCheckIn: () => void }) {
  const { t } = useTranslation();
  const { data: creature, isLoading } = useCreatureState();
  const { data: pets } = usePets();
  const phase = useDayPhase();
  const { data: message } = useMessageOfDay(phase);

  if (isLoading || !creature) return null;

  const activePetType = pets?.activePetType ?? creature.petType ?? "puff";
  const petName = pets?.petName ?? creature.petName ?? null;
  const definition = PET_DEFINITIONS.find((p) => p.type === activePetType);
  const displayName = petName?.trim() || (definition ? t(definition.labelKey) : "");
  const petMood = creature.petMood ?? "calm";

  return (
    <section
      aria-label={displayName}
      className="pet-gradient-bg rounded-3xl shadow-neumorphic p-5 pt-4 space-y-3 text-foreground"
    >
      <div className="flex items-center justify-between px-1">
        <p className="font-serif font-bold text-foreground text-lg leading-tight truncate">
          {displayName}
        </p>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-card shadow-neumorphic-sm text-xs font-semibold text-primary">
          {t("companion.level", { level: creature.level })}
        </span>
      </div>

      <div className="flex justify-center py-1">
        <PetAvatar
          petType={activePetType}
          size="lg"
          interactive
          ariaLabel={displayName}
          emotion={petMood === "happy" ? "happy" : "idle"}
        />
      </div>

      <div className="relative rounded-2xl bg-card shadow-neumorphic-sm px-4 py-3">
        <span
          aria-hidden="true"
          className="absolute left-6 -top-1.5 w-3.5 h-3.5 bg-card rotate-45"
        />
        <p className="text-sm font-semibold text-foreground leading-snug">
          {t(`petGreeter.question.${phase}`, { name: displayName })}
        </p>
        {message?.text && (
          <p className="mt-1 text-xs text-muted-foreground leading-snug">{message.text}</p>
        )}
        {message?.question && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{message.question}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onCheckIn}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5",
          "text-sm font-bold text-primary-foreground shadow-neumorphic-sm",
          "transition-[transform,filter] duration-150 hover:brightness-105 active:scale-[0.98]",
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {t("petGreeter.cta")}
        <ArrowRight aria-hidden="true" className="w-4 h-4" />
      </button>

      <p className="text-center text-[11px] text-muted-foreground">{t("petGreeter.hint")}</p>
    </section>
  );
}
