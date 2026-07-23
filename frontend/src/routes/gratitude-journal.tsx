import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry } from "../hooks/useEntries";
import GratitudeJournal from "../components/GratitudeJournal";

export default function GratitudeJournalPage() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const gratitudeParam = useMemo(() => params?.find((p) => p.name === "Gratitude"), [params]);
  const { data: entries } = useEntries(
    gratitudeParam ? { parameterId: gratitudeParam.id } : undefined,
  );
  const createEntry = useCreateEntry();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("dashboard.gratitudeJournal")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.gratitudePageSubtitle")}</p>
      </div>

      <GratitudeJournal
        parameterId={gratitudeParam?.id}
        entries={gratitudeParam ? (entries ?? []) : []}
        createEntry={createEntry}
        limit={100}
        hideTitle
      />
    </div>
  );
}
