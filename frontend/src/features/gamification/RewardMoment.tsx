import { useEffect, useState } from "react";
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
  xp?: number;
  className?: string;
}

export default function RewardMoment({
  title,
  subtitle,
  chip,
  showCollectionLink = false,
  xp,
  className,
}: RewardMomentProps) {
  const { t } = useTranslation();
  const { data: pets } = usePets();
  const { data: creature } = useCreatureState();
  const [feedSignal, setFeedSignal] = useState(0);
  const [shownXp, setShownXp] = useState(0);

  useEffect(() => {
    if (!xp) return;
    setFeedSignal(Date.now());
    setShownXp(0);
    const steps = Math.max(1, xp);
    const stepMs = Math.min(140, Math.max(60, Math.floor(1300 / steps)));
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= xp) {
        clearInterval(interval);
        setShownXp(xp);
      } else {
        setShownXp(current);
      }
    }, stepMs);
    return () => clearInterval(interval);
  }, [xp]);

  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");

  const heading = title ?? petName;
  const body = subtitle ?? t("reward.petHappy", { name: petName });
  const displayXp = xp !== undefined && shownXp > 0 ? shownXp : xp;

  return (
    <div className={cn("rounded-2xl bg-card shadow-elevation-3 border border-border", className)}>
      <div className="flex items-center gap-3 p-4">
        <PetAvatar
          petType={petType}
          size="lg"
          emotion="happy"
          ariaLabel={petName}
          feedSignal={feedSignal}
          contained
        />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground leading-tight truncate">{heading}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
          {(chip || xp) && (
            <span
              className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-xs font-semibold text-accent"
              aria-live="polite"
            >
              <Zap aria-hidden="true" className="w-3 h-3" />
              {xp !== undefined ? `+${displayXp} XP` : chip}
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
