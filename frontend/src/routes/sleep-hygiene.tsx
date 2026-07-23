import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry, useUpdateEntry } from "../hooks/useEntries";
import SleepHygieneChecklist from "../components/SleepHygieneChecklist";

export default function SleepHygienePage() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const hygieneParam = useMemo(() => params?.find((p) => p.name === "Sleep Hygiene"), [params]);
  const sleepParam = useMemo(() => params?.find((p) => p.name === "Sleep"), [params]);

  const { data: hygieneEntries } = useEntries(
    hygieneParam ? { parameterId: hygieneParam.id } : undefined,
  );
  const { data: sleepEntries } = useEntries(
    sleepParam ? { parameterId: sleepParam.id } : undefined,
  );
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("sleepHygiene.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("sleepHygiene.subtitle")}</p>
      </div>

      <SleepHygieneChecklist
        parameterId={hygieneParam?.id}
        hygieneEntries={hygieneParam ? (hygieneEntries ?? []) : []}
        sleepEntries={sleepParam ? (sleepEntries ?? []) : []}
        createEntry={createEntry}
        updateEntry={updateEntry}
      />
    </div>
  );
}
