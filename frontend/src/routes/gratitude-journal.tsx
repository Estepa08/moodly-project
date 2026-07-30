import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry } from "../hooks/useEntries";
import { useRewardPractice, PracticeSource } from "../features/gamification";
import { GratitudeJournal } from "../features/journal";
import PeriodSelector from "../components/ui/PeriodSelector";
import { isWithinLastDays } from "../lib/utils";

const GRATITUDE_PERIODS = [
  { key: "1m", label: "1m" },
  { key: "3m", label: "3m" },
  { key: "all", label: "All" },
] as const;

export default function GratitudeJournalPage() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const [period, setPeriod] = useState<string>("3m");
  const gratitudeParam = useMemo(() => params?.find((p) => p.name === "Gratitude"), [params]);
  const moodParam = useMemo(() => params?.find((p) => p.name === "Mood"), [params]);
  const { data: entries } = useEntries(
    gratitudeParam ? { parameterId: gratitudeParam.id } : undefined,
  );
  const { data: moodEntries } = useEntries(moodParam ? { parameterId: moodParam.id } : undefined);
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.Gratitude);
  });

  const periodDays = period === "all" ? Infinity : parseInt(period) * 30;

  const filteredEntries = useMemo(
    () =>
      (entries ?? []).filter((e) =>
        periodDays === Infinity ? true : isWithinLastDays(e.createdAt, periodDays),
      ),
    [entries, periodDays],
  );

  const filteredMoodEntries = useMemo(
    () =>
      (moodEntries ?? []).filter((e) =>
        periodDays === Infinity ? true : isWithinLastDays(e.createdAt, periodDays),
      ),
    [moodEntries, periodDays],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("dashboard.gratitudeJournal")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.gratitudePageSubtitle")}</p>
      </div>

      <div className="flex justify-center">
        <PeriodSelector
          options={GRATITUDE_PERIODS.map((p) => ({ key: p.key, label: p.label }))}
          value={period}
          onChange={setPeriod}
          size="sm"
          label={t("dashboard.dateRange")}
        />
      </div>

      <GratitudeJournal
        parameterId={gratitudeParam?.id}
        entries={filteredEntries}
        moodEntries={filteredMoodEntries}
        createEntry={createEntry}
        limit={100}
        hideTitle
      />
    </div>
  );
}
