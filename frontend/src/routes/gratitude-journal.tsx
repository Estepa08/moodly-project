import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry } from "../hooks/useEntries";
import { useRewardPractice, PracticeSource } from "../features/gamification";
import { GratitudeJournal } from "../features/journal";
import { isWithinLastDays } from "../lib/utils";

export default function GratitudeJournalPage() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const gratitudeParam = useMemo(() => params?.find((p) => p.name === "Gratitude"), [params]);
  const { data: entries } = useEntries(
    gratitudeParam ? { parameterId: gratitudeParam.id } : undefined,
  );
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.Gratitude);
  });

  const weekCount = useMemo(
    () => (entries ?? []).filter((e) => isWithinLastDays(e.createdAt, 7)).length,
    [entries],
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("dashboard.gratitudeJournal")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.gratitudePageSubtitle")}</p>
        {weekCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-accent font-medium mt-2">
            <Heart aria-hidden="true" className="w-4 h-4" />
            <span>{t("dashboard.gratitudeWeeklyCount", { count: weekCount })}</span>
          </div>
        )}
      </div>

      <GratitudeJournal
        parameterId={gratitudeParam?.id}
        entries={entries ?? []}
        createEntry={createEntry}
        limit={100}
        hideTitle
      />
    </div>
  );
}
