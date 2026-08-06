import { useTranslation } from "react-i18next";
import { useState } from "react";
import Lottie from "lottie-react";
import { Lock, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { usePets, useSetPet } from "./useCreature";
import { PET_DEFINITIONS, type PetDefinition } from "./pets";
import { usePetAnimation } from "./usePetAnimation";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const PREVIEW_COUNT = 6;

interface PetCardProps {
  pet: PetDefinition;
  isUnlocked: boolean;
  isActive: boolean;
  onSelect: (type: string) => void;
}

function PetCard({ pet, isUnlocked, isActive, onSelect }: PetCardProps) {
  const { t } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const animationData = usePetAnimation(pet.type, "idle");

  return (
    <button
      onClick={() => isUnlocked && !isActive && onSelect(pet.type)}
      disabled={!isUnlocked || isActive}
      className={cn(
        "relative w-full rounded-xl p-3 flex flex-col items-center gap-1.5 transition-[background-color,box-shadow,opacity,transform] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "min-h-[92px]",
        isActive
          ? "bg-card shadow-neumorphic-inset border-2 border-primary"
          : isUnlocked
            ? "bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]"
            : "bg-muted/40 opacity-70 cursor-not-allowed",
      )}
      aria-label={t(pet.labelKey)}
      aria-pressed={isActive}
    >
      {isActive && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check aria-hidden="true" className="w-3 h-3" strokeWidth={3} />
        </span>
      )}
      <div
        className={cn(
          "w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-xl shrink-0",
          isActive ? pet.color : isUnlocked ? "bg-secondary" : "bg-muted",
        )}
      >
        {isUnlocked ? (
          animationData && !isReducedMotion ? (
            <Lottie animationData={animationData} loop autoplay className="w-full h-full" />
          ) : (
            pet.emoji
          )
        ) : (
          <Lock aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <span className="text-xs font-medium text-center leading-tight line-clamp-1">
        {t(pet.labelKey)}
      </span>
    </button>
  );
}

export default function PetCollection() {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const setPet = useSetPet();
  const [showAll, setShowAll] = useState(false);

  const unlocked = pets?.unlockedPetTypes ?? ["puff"];
  const active = pets?.activePetType ?? "puff";

  const visiblePets = showAll ? PET_DEFINITIONS : PET_DEFINITIONS.slice(0, PREVIEW_COUNT);
  const hiddenCount = PET_DEFINITIONS.length - PREVIEW_COUNT;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {visiblePets.map((pet) => {
          const isUnlocked = unlocked.includes(pet.type);
          const isActive = active === pet.type;
          return (
            <PetCard
              key={pet.type}
              pet={pet}
              isUnlocked={isUnlocked}
              isActive={isActive}
              onSelect={setPet.mutate}
            />
          );
        })}
      </div>

      {!showAll && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl p-2.5 text-sm font-semibold text-foreground bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.99] transition-[box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("pets.showAll", { count: hiddenCount })}
        </button>
      )}
    </div>
  );
}
