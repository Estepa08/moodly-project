import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Zap } from "lucide-react";
import PetAvatar from "./PetAvatar";
import { usePets, useCreatureState } from "./useCreature";
import { PET_DEFINITIONS } from "./pets";
import { cn } from "../../lib/utils";

interface RewardMomentProps {
  title?: string;
  subtitle?: string;
  chip?: string;
  showCollectionLink?: boolean;
  className?: string;
}

export default function RewardMoment({
  title,
  subtitle,
  chip,
  showCollectionLink = false,
  className,
}: RewardMomentProps) {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const { data: creature } = useCreatureState();

  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");

  const heading = title ?? petName;
  const body = subtitle ?? t("reward.petHappy", { name: petName });

  return (
    <div className={cn("rounded-2xl bg-card shadow-elevation-3 border border-border", className)}>
      <div className="flex items-center gap-3 p-4">
        <PetAvatar petType={petType} size="lg" emotion="happy" ariaLabel={petName} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground leading-tight truncate">{heading}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
          {chip && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-xs font-semibold text-accent">
              <Zap aria-hidden="true" className="w-3 h-3" />
              {chip}
            </span>
          )}
          {creature && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("reward.streakLevel", { streak: creature.streak, level: creature.level })}
            </p>
          )}
        </div>
      </div>
      {showCollectionLink && (
        <Link
          to="/progress"
          className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-b-2xl"
        >
          {t("companion.toCollection")}
          <span aria-hidden="true" className="text-sm leading-none">
            ›
          </span>
        </Link>
      )}
    </div>
  );
}
