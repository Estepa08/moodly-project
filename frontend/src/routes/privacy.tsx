import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useSeo, withCanonical } from "../lib/seo";

const SECTIONS = [
  "operator",
  "legalBasis",
  "dataWeCollect",
  "howWeUse",
  "dataSharing",
  "crossBorder",
  "dataRetention",
  "securityMeasures",
  "yourRights",
  "responseTerms",
  "contact",
] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useSeo({
    title: t("privacy.seo.title"),
    description: t("privacy.seo.description"),
    canonical: withCanonical("/privacy"),
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-1" />
        {t("common.back")}
      </Button>
      <h1 className="text-xl font-bold font-serif">{t("privacy.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2 className="text-base font-semibold text-foreground">{t(`privacy.${key}`)}</h2>
            <p>{t(`privacy.${key}Text`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
