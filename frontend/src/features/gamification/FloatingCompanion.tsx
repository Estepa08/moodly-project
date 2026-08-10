import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import PetAvatar from "./PetAvatar";
import { usePets, usePet, useCreatureState } from "./useCreature";
import { PET_DEFINITIONS } from "./pets";
import { PET_DAILY_CLICK_LIMIT, PET_CYCLE, ENERGY_LOW_THRESHOLD } from "@moodly/shared";
import { isCompanionHidden, subscribeCompanionVisibility } from "./companionVisibility";
import { TITLE_EMOJI } from "./TitleSelector";
import { cn } from "../../lib/utils";

const HIDDEN_PATHS = ["/tests/", "/practices/breathing", "/onboarding"];

export default function FloatingCompanion() {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: pets } = usePets();
  const { data: creature } = useCreatureState();
  const pet = usePet();
  const [hidden, setHidden] = useState(isCompanionHidden);

  useEffect(() => subscribeCompanionVisibility(() => setHidden(isCompanionHidden)), []);

  if (hidden) return null;
  if (HIDDEN_PATHS.some((path) => location.pathname.startsWith(path))) return null;

  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");
  const petCount = creature?.petCount ?? 0;
  const energy = creature?.energy ?? 100;
  const limitReached = petCount >= PET_DAILY_CLICK_LIMIT;
  const hasEnergy = energy > 0;
  const xpEligible = !limitReached && hasEnergy;
  const cyclePosition = (petCount % PET_CYCLE) + 1;
  const title = creature?.activeTitle ?? null;
  const titleEmoji = title ? (TITLE_EMOJI[title] ?? "🎖️") : null;

  return (
    <div
      className="fixed right-4 bottom-[calc(5rem+var(--sab))] md:bottom-6 md:right-6 z-40 animate-pet-float"
      role="presentation"
    >
      <div className="flex flex-col items-center gap-1">
        <PetAvatar
          petType={petType}
          size="md"
          interactive
          ariaLabel={petName}
          xpEligible={xpEligible}
          cyclePosition={cyclePosition}
          onTap={() => pet.mutate()}
        />
        {titleEmoji && (
          <span
            aria-hidden="true"
            className="w-6 h-6 rounded-full bg-card shadow-neumorphic-sm flex items-center justify-center text-sm"
          >
            {titleEmoji}
          </span>
        )}
        {/* NEW: мини-бар энергии под аватаром */}
        <div className="w-[72px]">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300",
                energy <= ENERGY_LOW_THRESHOLD ? "bg-destructive" : "bg-warning",
              )}
              style={{ width: `${Math.max(0, Math.min(100, energy))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
