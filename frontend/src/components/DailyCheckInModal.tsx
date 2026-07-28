import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sun, Flame, Sparkles, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
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
    <Dialog open={open} onOpenChange={(next) => { if (!next) onDismiss(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Sun className="w-6 h-6 text-accent" />
            </div>
            <DialogTitle className="text-lg text-foreground font-serif">
              {t(greetingKey)}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            {t("dailyCheckIn.body")}
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
