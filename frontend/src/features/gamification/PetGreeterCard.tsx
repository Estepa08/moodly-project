import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useCreatureState, usePets } from "./useCreature";
import { usePetReward } from "./usePetReward";
import { PET_DEFINITIONS } from "./pets";
import { PET_CYCLE } from "@moodly/shared";
import PetAvatar, { type PetHide, type PetHideVariant } from "./PetAvatar";
import PetSpeechBubble, { usePetSpeech } from "./PetSpeechBubble";
import { emitSpeech } from "./celebration";
import { TITLE_MAP, TITLE_EMOJI } from "./TitleSelector";
import { useSpeechBubbleHidden } from "./speechBubbleVisibility";
import { useDayPhase } from "../../hooks/useDayPhase";
import { useMessageOfDay } from "../../hooks/useMessageOfDay";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cn } from "../../lib/utils";
import { ENERGY_COLOR } from "../../lib/constants";

interface PetGreeterCardProps {
  onCheckIn: () => void;
}

// Idle-цикл скрытия питомца внутри круга (см. docs/pet-greeter-hide-animations.svg):
// виден ~10s → медленно скрывается (3.5s, случайный вариант) → пауза → pop-in.
const IDLE_VISIBLE_MS = 10_000;
const IDLE_HIDE_MS = 3_600;
const IDLE_PAUSE_MS = 1_500;
const IDLE_APPEAR_MS = 650;
const HIDE_VARIANTS: PetHideVariant[] = ["sink", "melt", "dissolve", "collapse", "tumble"];

type IdlePhase = "visible" | "hiding" | "hidden" | "appearing";

export default function PetGreeterCard({ onCheckIn }: PetGreeterCardProps) {
  const { t } = useTranslation();
  const { data: creature, isLoading } = useCreatureState();
  const { data: pets } = usePets();
  const { reward, glow, handlePet } = usePetReward();
  const phase = useDayPhase();
  const { data: message } = useMessageOfDay(phase);
  const speech = usePetSpeech();
  const speechHidden = useSpeechBubbleHidden();
  const isReducedMotion = useReducedMotion();
  const [idlePhase, setIdlePhase] = useState<IdlePhase>("visible");
  const [hide, setHide] = useState<PetHide | null>(null);

  // Таймлайн idle-цикла: первый заход — питомец сразу виден, скрытие начинается
  // после паузы. reduced-motion → цикл не запускается (только float).
  useEffect(() => {
    if (isReducedMotion) return;
    let timer: ReturnType<typeof setTimeout>;
    switch (idlePhase) {
      case "visible":
        timer = setTimeout(() => {
          setHide({
            id: Date.now(),
            variant: HIDE_VARIANTS[Math.floor(Math.random() * HIDE_VARIANTS.length)],
          });
          setIdlePhase("hiding");
        }, IDLE_VISIBLE_MS);
        break;
      case "hiding":
        timer = setTimeout(() => setIdlePhase("hidden"), IDLE_HIDE_MS);
        break;
      case "hidden":
        timer = setTimeout(() => {
          setHide(null);
          setIdlePhase("appearing");
        }, IDLE_PAUSE_MS);
        break;
      case "appearing":
        timer = setTimeout(() => setIdlePhase("visible"), IDLE_APPEAR_MS);
        break;
    }
    return () => clearTimeout(timer);
  }, [idlePhase, isReducedMotion]);

  const queue = [t(`petGreeter.question.${phase}`), message?.text, message?.question].filter(
    (line): line is string => typeof line === "string" && line.trim().length > 0,
  );

  useEffect(() => {
    const timers = queue.map((line, i) => setTimeout(() => emitSpeech(line), i * 900));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, message?.text, message?.question]);

  if (isLoading || !creature) return null;

  const activePetType = pets?.activePetType ?? creature.petType ?? "puff";
  const petName = pets?.petName ?? creature.petName ?? null;
  const definition = PET_DEFINITIONS.find((p) => p.type === activePetType);
  const displayName = petName?.trim() || (definition ? t(definition.labelKey) : "");

  const petCount = creature.petCount ?? 0;
  const energy = creature.energy ?? 100;
  const cyclePosition = (petCount % PET_CYCLE) + 1;
  const energyPercent = Math.max(0, Math.min(100, energy));

  const title = creature.activeTitle ?? null;
  const titleEmoji = title ? (TITLE_EMOJI[title] ?? "🎖️") : null;
  const titleLabel = title ? t(TITLE_MAP[title] ?? "progress.noTitle") : null;

  const handleTap = () => {
    handlePet();
    queue.forEach((line) => setTimeout(() => emitSpeech(line), 0));
  };

  return (
    <section
      aria-label={displayName}
      className="pet-gradient-bg rounded-3xl shadow-neumorphic p-5 pt-4 space-y-3 text-foreground"
    >
      <div className="flex items-center gap-2 px-1">
        <p className="font-serif font-bold text-foreground text-lg leading-tight truncate">
          {displayName}
        </p>
        {title && titleEmoji && (
          <span
            className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-card shadow-neumorphic-sm text-xs font-semibold text-primary"
            title={titleLabel ?? undefined}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {titleEmoji}
            </span>
            <span className="hidden sm:inline">{titleLabel}</span>
          </span>
        )}
        <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-card shadow-neumorphic-sm text-xs font-semibold text-primary">
          {t("companion.level", { level: creature.level })}
        </span>
      </div>

      <div className="relative flex flex-col items-center gap-2 pt-6 pb-1">
        <div
          className={cn(
            "h-28 w-28 rounded-full bg-card/60 flex items-center justify-center",
            !isReducedMotion && "animate-pet-float",
            (idlePhase === "hiding" || idlePhase === "hidden") && "overflow-hidden",
          )}
        >
          <PetAvatar
            petType={activePetType}
            size="lg"
            plain
            interactive
            cyclePosition={cyclePosition}
            reward={reward}
            glow={glow}
            reappear={idlePhase === "appearing"}
            hide={hide}
            onTap={handleTap}
            ariaLabel={displayName}
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

      {!speechHidden && speech.current && (
        <PetSpeechBubble current={speech.current} dismiss={speech.dismiss} />
      )}

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
