import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Heart, Wind, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";

interface LowMoodAlertProps {
  open: boolean;
  onDismiss: () => void;
}

export default function LowMoodAlert({ open, onDismiss }: LowMoodAlertProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onDismiss(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-lg text-foreground font-serif">
              {t("lowMood.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            {t("lowMood.body")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            variant="default"
            className="w-full flex items-center gap-2"
            onClick={() => { navigate("/breathing"); onDismiss(); }}
          >
            <Wind className="w-4 h-4" />
            {t("lowMood.actionBreathing")}
          </Button>
          <Button
            variant="secondary"
            className="w-full flex items-center gap-2"
            onClick={() => { navigate("/tests"); onDismiss(); }}
          >
            <ClipboardList className="w-4 h-4" />
            {t("lowMood.actionTest")}
          </Button>
        </div>

        <Button variant="ghost" className="w-full mt-1" onClick={onDismiss}>
          {t("lowMood.dismiss")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
