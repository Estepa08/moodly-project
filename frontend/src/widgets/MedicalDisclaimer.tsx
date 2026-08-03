import { useTranslation } from "react-i18next";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  className?: string;
  variant?: "expanded" | "compact";
}

export default function WellnessDisclaimer({ className, variant = "expanded" }: Props) {
  const { t } = useTranslation();

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground",
          className,
        )}
      >
        <Info aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
        <span>{t("testResults.disclaimerCompact")}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl bg-white p-3 border border-border",
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{t("testResults.disclaimer")}</p>
    </div>
  );
}
