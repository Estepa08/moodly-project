import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { PhoneCall, Heart } from "lucide-react";

interface Props {
  open: boolean;
  onDismiss: () => void;
}

export default function SupportResources({ open, onDismiss }: Props) {
  const { t, i18n } = useTranslation();
  const isRu = i18n.language === "ru";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDismiss(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Heart aria-hidden="true" className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-lg text-foreground font-serif">
              {t("supportResources.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            {t("supportResources.body")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl bg-secondary/50 p-4 border border-border">
          <p className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
            <PhoneCall aria-hidden="true" className="w-3.5 h-3.5" />
            {t("supportResources.helpline")}
          </p>

          {isRu ? (
            <>
              <a
                href="tel:112"
                className="block w-full text-center py-3 rounded-lg bg-primary text-primary-foreground font-bold text-lg transition-colors hover:opacity-90"
              >
                112
              </a>
              <a
                href="tel:88002000122"
                className="block w-full text-center py-3 rounded-lg bg-primary text-primary-foreground font-bold text-lg transition-colors hover:opacity-90"
              >
                8-800-200-01-22
              </a>
            </>
          ) : (
            <a
              href="tel:988"
              className="block w-full text-center py-3 rounded-lg bg-primary text-primary-foreground font-bold text-lg transition-colors hover:opacity-90"
            >
              {t("supportResources.call")} 988
            </a>
          )}
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t("supportResources.localEmergency")}
          </p>
        </div>

        <Button variant="outline" className="w-full" onClick={onDismiss}>
          {t("common.close")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
