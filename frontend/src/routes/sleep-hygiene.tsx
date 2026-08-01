import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry, useUpdateEntry } from "../hooks/useEntries";
import { useRewardPractice, PracticeSource } from "../features/gamification";
import { SleepHygieneChecklist } from "../features/check-in";

export default function SleepHygienePage() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const hygieneParam = useMemo(() => params?.find((p) => p.name === "Sleep Hygiene"), [params]);

  const { data: hygieneEntries } = useEntries(
    hygieneParam ? { parameterId: hygieneParam.id } : undefined,
  );
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.SleepHygiene);
  });
  const updateEntry = useUpdateEntry();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("sleepHygiene.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("sleepHygiene.subtitle")}</p>
      </div>

      <SleepHygieneChecklist
        parameterId={hygieneParam?.id}
        hygieneEntries={hygieneParam ? (hygieneEntries ?? []) : []}
        createEntry={createEntry}
        updateEntry={updateEntry}
      />
    </div>
  );
}
