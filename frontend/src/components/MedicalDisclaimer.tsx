import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  className?: string;
}

export default function MedicalDisclaimer({ className }: Props) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl bg-muted p-3 border border-border",
        className,
      )}
    >
      <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{t("testResults.disclaimer")}</p>
    </div>
  );
}
