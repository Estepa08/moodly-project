import { useTranslation } from "react-i18next";
import { Sun, Flame, Sparkles, Zap } from "lucide-react";
import { ModalShell } from "./ui/modal-shell";
import { Button } from "./ui/button";

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

  const hour = new Date().getHours();
  const greetingKey = hour < 12
    ? "dailyCheckIn.greetingMorning"
    : hour < 18
      ? "dailyCheckIn.greetingAfternoon"
      : "dailyCheckIn.greetingEvening";

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => { if (!next) onDismiss(); }}
      icon={Sun}
      iconSize="md"
      iconBg="bg-accent/10"
      iconColor="text-accent"
      title={t(greetingKey)}
      description={t("dailyCheckIn.body")}
    >
      {streak > 0 && (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50">
          <Flame className="w-5 h-5 text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {t("dailyCheckIn.streak", { count: streak })}
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{t("dailyCheckIn.expGained")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>{t("dailyCheckIn.energyRestored")}</span>
        </div>
      </div>

      <Button
        variant="default"
        className="w-full"
        onClick={onCheckIn}
        disabled={isPending}
      >
        {isPending ? t("dailyCheckIn.checkingIn") : t("dailyCheckIn.button")}
      </Button>
    </ModalShell>
  );
}
