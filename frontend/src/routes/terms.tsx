import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-1" />
        {t("common.back")}
      </Button>
      <h1 className="text-xl font-bold font-serif">{t("terms.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("terms.acceptance")}</h2>
          <p>{t("terms.acceptanceText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            {t("terms.serviceDescription")}
          </h2>
          <p>{t("terms.serviceDescriptionText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("terms.userObligations")}</h2>
          <p>{t("terms.userObligationsText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            {t("terms.medicalDisclaimer")}
          </h2>
          <p>{t("terms.medicalDisclaimerText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">
            {t("terms.limitationOfLiability")}
          </h2>
          <p>{t("terms.limitationOfLiabilityText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("terms.contact")}</h2>
          <p>{t("terms.contactText")}</p>
        </section>
      </div>
    </div>
  );
}
