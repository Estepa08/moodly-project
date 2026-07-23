import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { PhoneCall, Heart } from "lucide-react";
import { cn } from "../lib/utils";

const WARM = "38 92% 50%";
const WARM_BG = "38 92% 95%";
const WARM_BORDER = "38 60% 80%";

interface Props {
  open: boolean;
  severity: "urgent" | "critical";
  onDismiss: () => void;
}

const COUNTDOWN_SECONDS = 10;

export default function CrisisDialog({ open, severity, onDismiss }: Props) {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === "ru";
  const [canDismiss, setCanDismiss] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!open) {
      setCanDismiss(false);
      setCountdown(COUNTDOWN_SECONDS);
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);
    setCanDismiss(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanDismiss(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const isCritical = severity === "critical";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className={cn("max-w-sm border-2")}
        style={{ borderColor: `hsl(${WARM_BORDER})` }}
        onInteractOutside={(e) => e.preventDefault()}
        hideClose
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `hsl(${WARM_BG})` }}
            >
              <Heart className="w-5 h-5 text-foreground" />
            </div>
            <DialogTitle className="text-lg text-foreground font-serif">
              {t(isCritical ? "crisis.titleCritical" : "crisis.titleUrgent")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            {t(isCritical ? "crisis.bodyCritical" : "crisis.bodyUrgent")}
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-3 rounded-xl p-4"
          style={{
            backgroundColor: `hsl(${WARM_BG})`,
            borderColor: `hsl(${WARM_BORDER})`,
            borderWidth: 1,
          }}
        >
          <p
            className="text-xs font-medium flex items-center gap-1.5"
            style={{ color: `hsl(${WARM})` }}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            {t("crisis.helpline")}
          </p>

          {isRu ? (
            <>
              <a
                href="tel:88002000122"
                className="block w-full text-center py-3 rounded-lg text-white font-bold text-lg transition-colors"
                style={{ backgroundColor: `hsl(${WARM})` }}
              >
                8-800-200-01-22
              </a>
              <a
                href="tel:112"
                className="block w-full text-center py-3 rounded-lg text-white font-bold text-lg transition-colors"
                style={{ backgroundColor: `hsl(${WARM})` }}
              >
                112
              </a>
            </>
          ) : (
            <a
              href="tel:988"
              className="block w-full text-center py-3 rounded-lg text-white font-bold text-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: `hsl(${WARM})` }}
            >
              {t("crisis.callNow")} 988
            </a>
          )}
        </div>

        <Button variant="default" className="w-full" disabled={!canDismiss} onClick={onDismiss}>
          {canDismiss ? t("crisis.dismissAfter") : `${t("crisis.pleaseWait")} ${countdown}s`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
