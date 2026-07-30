import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Heart, Wind, ClipboardList } from "lucide-react";
import { ModalShell } from "../../components/ui/modal-shell";
import { Button } from "../../components/ui/button";

interface LowMoodAlertProps {
  open: boolean;
  onDismiss: () => void;
}

export default function LowMoodAlert({ open, onDismiss }: LowMoodAlertProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      icon={Heart}
      title={t("lowMood.title")}
      description={t("lowMood.body")}
    >
      <div className="flex flex-col gap-2 mt-2">
        <Button
          variant="default"
          className="w-full flex items-center gap-2"
          onClick={() => {
            navigate("/breathing");
            onDismiss();
          }}
        >
          <Wind aria-hidden="true" className="w-4 h-4" />
          {t("lowMood.actionBreathing")}
        </Button>
        <Button
          variant="secondary"
          className="w-full flex items-center gap-2"
          onClick={() => {
            navigate("/tests");
            onDismiss();
          }}
        >
          <ClipboardList aria-hidden="true" className="w-4 h-4" />
          {t("lowMood.actionTest")}
        </Button>
      </div>

      <Button variant="ghost" className="w-full mt-1" onClick={onDismiss}>
        {t("lowMood.dismiss")}
      </Button>
    </ModalShell>
  );
}
