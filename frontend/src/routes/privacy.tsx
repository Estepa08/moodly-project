import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-1" />
        {t("common.back")}
      </Button>
      <h1 className="text-xl font-bold font-serif">{t("privacy.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("privacy.dataWeCollect")}</h2>
          <p>{t("privacy.dataWeCollectText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("privacy.howWeUse")}</h2>
          <p>{t("privacy.howWeUseText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("privacy.dataSharing")}</h2>
          <p>{t("privacy.dataSharingText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("privacy.dataRetention")}</h2>
          <p>{t("privacy.dataRetentionText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("privacy.yourRights")}</h2>
          <p>{t("privacy.yourRightsText")}</p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">{t("privacy.contact")}</h2>
          <p>{t("privacy.contactText")}</p>
        </section>
      </div>
    </div>
  );
}
