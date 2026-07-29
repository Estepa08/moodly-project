import { useTranslation } from "react-i18next";
import { ModalShell } from "../../components/ui/modal-shell";
import { Button } from "../../components/ui/button";
import { PhoneCall } from "lucide-react";

interface Props {
  open: boolean;
  onContinue: () => void;
  onSkip: () => void;
}

export default function ContentWarningDialog({ open, onContinue, onSkip }: Props) {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === "ru";

  return (
    <ModalShell
      open={open}
      onOpenChange={() => {}}
      title={t("contentWarning.title")}
      description={t("contentWarning.body")}
      preventClose
    >
      <div className="space-y-2 rounded-lg bg-destructive/10 p-3 border border-destructive/20">
        <p className="text-xs font-medium text-destructive flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5" />
          {t("crisis.helpline")}
        </p>
        {isRu ? (
          <>
            <p className="text-sm font-semibold text-foreground">8-800-200-01-22</p>
            <p className="text-sm font-semibold text-foreground">112</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-foreground">988</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSkip}>
          {t("contentWarning.skip")}
        </Button>
        <Button className="flex-1" onClick={onContinue}>
          {t("contentWarning.continue")}
        </Button>
      </div>
    </ModalShell>
  );
}
