import { useTranslation } from "react-i18next";
import { Lock, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { usePets, useSetPet } from "./useCreature";
import { PET_DEFINITIONS } from "./pets";

export default function PetCollection() {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const setPet = useSetPet();

  const unlocked = pets?.unlockedPetTypes ?? ["puff"];
  const active = pets?.activePetType ?? "puff";
  const feedCounts = pets?.feedCounts ?? {};

  return (
    <div className="grid grid-cols-3 gap-2 justify-items-center">
      {PET_DEFINITIONS.map((pet) => {
        const isUnlocked = unlocked.includes(pet.type);
        const isActive = active === pet.type;
        return (
          <button
            key={pet.type}
            onClick={() => isUnlocked && !isActive && setPet.mutate(pet.type)}
            disabled={!isUnlocked || isActive}
            className={cn(
              "w-full max-w-28 rounded-xl p-3 flex flex-col items-center gap-1.5 transition-[background-color,box-shadow,opacity,transform] duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 shadow-neumorphic-inset ring-2 ring-primary"
                : isUnlocked
                  ? "bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]"
                  : "bg-muted/50 opacity-50 cursor-not-allowed",
            )}
            aria-label={t(pet.labelKey)}
          >
            <div
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center text-xl",
                isActive ? pet.color : isUnlocked ? "bg-secondary" : "bg-muted",
              )}
            >
              {isUnlocked ? (
                pet.emoji
              ) : (
                <Lock aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs font-medium text-center leading-tight">{t(pet.labelKey)}</span>
            {isActive && (
              <span className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
                <Check aria-hidden="true" className="w-3 h-3" /> {t("pets.active")}
              </span>
            )}
            {isUnlocked && (feedCounts[pet.type] ?? 0) > 0 && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <span aria-hidden="true">{pet.feed?.[0] ?? "🫧"}</span>
                {t("pets.fedCount", { count: feedCounts[pet.type] })}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
