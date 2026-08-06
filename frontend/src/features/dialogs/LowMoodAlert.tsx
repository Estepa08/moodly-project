import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Wind } from "lucide-react";
import { ModalShell } from "../../components/ui/modal-shell";
import { Button } from "../../components/ui/button";
import PetAvatar from "../gamification/PetAvatar";
import { usePets } from "../gamification";
import { PET_DEFINITIONS } from "../gamification/pets";

interface LowMoodAlertProps {
  open: boolean;
  onDismiss: () => void;
}

export default function LowMoodAlert({ open, onDismiss }: LowMoodAlertProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: pets } = usePets();

  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      title={t("lowMood.title")}
      description={t("lowMood.body", { name: petName })}
    >
      <div className="flex justify-center">
        <PetAvatar petType={petType} size="lg" ariaLabel={petName} />
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <Button
          variant="default"
          className="w-full flex flex-col items-center gap-0 h-auto py-2.5"
          onClick={() => {
            navigate("/practices/breathing");
            onDismiss();
          }}
        >
          <span className="flex items-center gap-2">
            <Wind aria-hidden="true" className="w-4 h-4" />
            {t("lowMood.actionBreathing")}
          </span>
          <span className="text-xs font-normal opacity-80">{t("lowMood.actionBreathingSub")}</span>
        </Button>
        <Button
          variant="secondary"
          className="w-full flex items-center gap-2"
          onClick={() => {
            navigate("/my-day");
            onDismiss();
          }}
        >
          {t("lowMood.actionRecord")}
        </Button>
      </div>

      <Button variant="ghost" className="w-full mt-1" onClick={onDismiss}>
        {t("lowMood.dismiss")}
      </Button>
    </ModalShell>
  );
}
