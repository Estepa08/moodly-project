import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  className?: string;
}

export default function DisclaimerBanner({ className }: Props) {
  const { t } = useTranslation();
  return (
    <div className={cn("space-y-2 text-xs text-muted-foreground leading-relaxed", className)}>
      <div className="flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{t("login.disclaimer")}</span>
      </div>
      <div className="flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{t("login.privacyNotice")}</span>
      </div>
    </div>
  );
}
