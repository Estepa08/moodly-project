import { useTranslation } from "react-i18next";
import { Lock, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { usePets, useSetPet } from "./useCreature";

const PET_DEFINITIONS = [
  { type: "puff", labelKey: "pets.puff", color: "bg-purple-500", emoji: "🫧" },
  { type: "ember", labelKey: "pets.ember", color: "bg-red-500", emoji: "🔥" },
  { type: "dewdrop", labelKey: "pets.dewdrop", color: "bg-cyan-500", emoji: "💧" },
  { type: "sprout", labelKey: "pets.sprout", color: "bg-green-500", emoji: "🌱" },
  { type: "comet", labelKey: "pets.comet", color: "bg-indigo-500", emoji: "✨" },
  { type: "aurora", labelKey: "pets.aurora", color: "bg-pink-500", emoji: "🌈" },
];

export default function PetCollection() {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const setPet = useSetPet();

  const unlocked = pets?.unlockedPetTypes ?? ["puff"];
  const active = pets?.activePetType ?? "puff";

  return (
    <div className="grid grid-cols-3 gap-2">
      {PET_DEFINITIONS.map((pet) => {
        const isUnlocked = unlocked.includes(pet.type);
        const isActive = active === pet.type;
        return (
          <button
            key={pet.type}
            onClick={() => isUnlocked && !isActive && setPet.mutate(pet.type)}
            disabled={!isUnlocked || isActive}
            className={cn(
              "rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 shadow-neumorphic-sm ring-2 ring-primary"
                : isUnlocked
                  ? "bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]"
                  : "bg-muted/50 opacity-50 cursor-not-allowed",
            )}
            aria-label={t(pet.labelKey)}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                isActive ? pet.color : isUnlocked ? "bg-secondary" : "bg-muted",
              )}
            >
              {isUnlocked ? pet.emoji : <Lock className="w-4 h-4 text-muted-foreground" />}
            </div>
            <span className="text-[11px] font-medium text-center leading-tight">
              {t(pet.labelKey)}
            </span>
            {isActive && (
              <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                <Check className="w-3 h-3" /> {t("pets.active")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
