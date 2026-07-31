import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Info, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";

export function AuthDisclaimer() {
  const { t } = useTranslation();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <div className="border-t border-border pt-3">
      <Button
        variant="link"
        size="sm"
        onClick={() => setShowDisclaimer(!showDisclaimer)}
        className="h-auto px-0 gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <Info aria-hidden="true" className="w-3.5 h-3.5" />
        <span>{t("login.disclaimerTitle")}</span>
        <ChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 transition-transform duration-200 ${showDisclaimer ? "rotate-180" : ""}`}
        />
      </Button>
      {showDisclaimer && (
        <div className="mt-2 space-y-2 text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1">
          <p>{t("login.disclaimer")}</p>
          <div className="flex gap-3 pt-1">
            <Link to="/privacy" className="text-primary hover:underline">
              {t("login.privacyPolicy")}
            </Link>
            <Link to="/terms" className="text-primary hover:underline">
              {t("login.termsOfService")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
