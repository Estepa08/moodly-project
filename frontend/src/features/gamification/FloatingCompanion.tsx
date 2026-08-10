import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import PetAvatar from "./PetAvatar";
import { usePets, usePet, useCreatureState } from "./useCreature";
import { PET_DEFINITIONS } from "./pets";
import { PET_XP_DAILY_LIMIT } from "@moodly/shared";
import { isCompanionHidden, subscribeCompanionVisibility } from "./companionVisibility";

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
  const xpEligible = (creature?.petCount ?? 0) < PET_XP_DAILY_LIMIT;

  return (
    <div
      className="fixed right-4 bottom-[calc(5rem+var(--sab))] md:bottom-6 md:right-6 z-40 animate-pet-float"
      role="presentation"
    >
      <PetAvatar
        petType={petType}
        size="md"
        interactive
        ariaLabel={petName}
        xpEligible={xpEligible}
        onTap={() => pet.mutate()}
      />
    </div>
  );
}
