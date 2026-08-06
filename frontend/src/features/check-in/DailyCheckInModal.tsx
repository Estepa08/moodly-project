import { useTranslation } from "react-i18next";
import { Flame, Zap, Sparkles } from "lucide-react";
import { ModalShell } from "../../components/ui/modal-shell";
import { ComponentSize } from "../../lib/constants";
import { Button } from "../../components/ui/button";
import PetAvatar from "../gamification/PetAvatar";
import { usePets } from "../gamification";
import { PET_DEFINITIONS } from "../gamification/pets";

interface DailyCheckInModalProps {
  open: boolean;
  onCheckIn: () => void;
  onDismiss: () => void;
  streak: number;
  isPending: boolean;
}

export default function DailyCheckInModal({
  open,
  onCheckIn,
  onDismiss,
  streak,
  isPending,
}: DailyCheckInModalProps) {
  const { t } = useTranslation();
  const { data: pets } = usePets();

  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12
      ? "dailyCheckIn.greetingMorning"
      : hour < 18
        ? "dailyCheckIn.greetingAfternoon"
        : "dailyCheckIn.greetingEvening";

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      icon={Sparkles}
      iconSize={ComponentSize.Md}
      iconBg="bg-accent/10"
      iconColor="text-accent"
      title={t(greetingKey)}
      description={t("dailyCheckIn.petGreeting", { name: petName })}
    >
      <div className="flex justify-center">
        <PetAvatar petType={petType} size="lg" interactive ariaLabel={petName} />
      </div>

      {streak > 0 && (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50">
          <Flame aria-hidden="true" className="w-5 h-5 text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {t("dailyCheckIn.streakDays", { count: streak })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl bg-accent/10">
          <span className="text-sm font-bold text-accent">{t("dailyCheckIn.expGained")}</span>
          <span className="text-xs text-muted-foreground">{t("dailyCheckIn.expSub")}</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl bg-primary/10">
          <span className="flex items-center gap-1 text-sm font-bold text-primary">
            <Zap aria-hidden="true" className="w-3.5 h-3.5" />
            {t("dailyCheckIn.energyRestored")}
          </span>
          <span className="text-xs text-muted-foreground">{t("dailyCheckIn.energySub")}</span>
        </div>
      </div>

      <Button variant="default" className="w-full mt-1" onClick={onCheckIn} disabled={isPending}>
        {isPending ? t("dailyCheckIn.checkingIn") : t("dailyCheckIn.button")}
      </Button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full text-center text-xs text-muted-foreground py-1 rounded-lg transition-[color] duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("dailyCheckIn.remindLater")}
      </button>
    </ModalShell>
  );
}
