import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import PetAvatar from "./PetAvatar";
import PetSpeechBubble, { usePetSpeech } from "./PetSpeechBubble";
import { useSpeechBubbleHidden } from "./speechBubbleVisibility";
import { emitSpeech } from "./celebration";
import { PET_DEFINITIONS } from "./pets";
import { usePets, usePet } from "./useCreature";
import { StreakIndicator } from "./index";
import { ProgressBar } from "../../components/ui/progress-bar";
import { EXP_PER_LEVEL, ENERGY_COLOR } from "../../lib/constants";
import { PET_DAILY_CLICK_LIMIT, PET_CYCLE } from "@moodly/shared";
import { TITLE_MAP, TITLE_EMOJI } from "./TitleSelector";
import type { CreatureState } from "../../lib/api";

interface ProgressHeroProps {
  creature: CreatureState;
}

export default function ProgressHero({ creature }: ProgressHeroProps) {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const pet = usePet();
  const speech = usePetSpeech();
  const speechHidden = useSpeechBubbleHidden();
  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");
  const nextLevelExp = creature.level * EXP_PER_LEVEL;
  const expPercent = Math.min(100, Math.round((creature.experience / nextLevelExp) * 100));

  const petCount = creature.petCount ?? 0;
  const limitReached = petCount >= PET_DAILY_CLICK_LIMIT;
  const hasEnergy = (creature.energy ?? 100) > 0;
  const cyclePosition = (petCount % PET_CYCLE) + 1;
  const title = creature.activeTitle ?? null;
  const titleEmoji = title ? (TITLE_EMOJI[title] ?? "🎖️") : null;
  const titleLabel = title ? t(TITLE_MAP[title] ?? "progress.noTitle") : null;

  const energy = creature.energy ?? 100;
  const energyPercent = Math.max(0, Math.min(100, energy));
  const speechText = t("progress.speech", {
    count: creature.streak,
    level: creature.level,
  });

  useEffect(() => {
    const timer = setTimeout(() => emitSpeech(speechText), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creature.level, creature.streak]);

  const handleTap = () => {
    pet.mutate();
    emitSpeech(speechText);
  };

  return (
    <div className="rounded-xl bg-card shadow-neumorphic p-5">
      <div className="flex items-center gap-4">
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
            <PetAvatar
              petType={petType}
              size="lg"
              plain
              interactive
              ariaLabel={petName}
              xpEligible={!limitReached && hasEnergy}
              cyclePosition={cyclePosition}
              className="animate-pet-float"
              onTap={handleTap}
            />
          </div>
          {/* NEW: мини-бар энергии под аватаром */}
          <div className="w-[72px]">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${energyPercent}%`, backgroundColor: ENERGY_COLOR }}
              />
            </div>
            <p className="mt-0.5 text-center text-[10px] font-bold text-muted-foreground tabular-nums">
              ⚡ {energy}
            </p>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-primary/10 text-xs font-bold text-primary">
              {t("creature.level", { level: creature.level })}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 text-xs font-semibold text-accent">
              <Sparkles aria-hidden="true" className="w-3 h-3" />
              {t(`petStage.${creature.stage ?? "baby"}`)}
            </span>
            {title && titleEmoji && (
              <span
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-info/10 text-xs font-semibold text-info"
                title={titleLabel ?? undefined}
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  {titleEmoji}
                </span>
                <span className="hidden sm:inline">{titleLabel}</span>
              </span>
            )}
            <StreakIndicator streak={creature.streak} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar
                segments={[
                  {
                    value: expPercent,
                    className:
                      "rounded-full bg-primary shadow-neumorphic-sm transition-[width] duration-300",
                  },
                ]}
                height={4}
                trackClassName="bg-muted"
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums font-medium whitespace-nowrap">
              {creature.experience}/{nextLevelExp} XP
            </span>
          </div>
        </div>
      </div>

      {!speechHidden && speech.current && (
        <div className="mt-3">
          <PetSpeechBubble current={speech.current} dismiss={speech.dismiss} />
        </div>
      )}
    </div>
  );
}
