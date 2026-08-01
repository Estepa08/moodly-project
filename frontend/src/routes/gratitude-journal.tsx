import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Heart, Smile } from "lucide-react";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry } from "../hooks/useEntries";
import { useRewardPractice, PracticeSource } from "../features/gamification";
import { GratitudeJournal } from "../features/journal";
import { TrendPreview, Chart } from "../features/analytics";
import PeriodSelector from "../components/ui/PeriodSelector";
import EmptyState from "../components/ui/empty-state";
import { isWithinLastDays, formatChartDate } from "../lib/utils";

const GRATITUDE_PERIODS = [
  { key: "1m", label: "1m" },
  { key: "3m", label: "3m" },
  { key: "all", label: "All" },
] as const;

export default function GratitudeJournalPage() {
  const { t, i18n } = useTranslation();
  const { data: params } = useParameters();
  const [period, setPeriod] = useState<string>("3m");
  const [chartOpen, setChartOpen] = useState(false);
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

  const weekCount = useMemo(
    () => (entries ?? []).filter((e) => isWithinLastDays(e.createdAt, 7)).length,
    [entries],
  );

  const last7 = useMemo(() => {
    const arr: (number | null)[] = new Array(7).fill(null);
    for (const e of entries ?? []) {
      const dayIndex = Math.floor((Date.now() - new Date(e.createdAt).getTime()) / 86_400_000);
      if (dayIndex >= 0 && dayIndex < 7) {
        const idx = 6 - dayIndex;
        arr[idx] = (arr[idx] ?? 0) + 1;
      }
    }
    return arr;
  }, [entries]);

  const activeDays = last7.filter((v): v is number => v !== null).length;

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

  const correlationData = useMemo(() => {
    const byDay = new Map<string, { gratitude: number[]; mood: number[] }>();
    for (const e of filteredEntries) {
      const key = formatChartDate(new Date(e.createdAt), i18n.language, false);
      if (!byDay.has(key)) byDay.set(key, { gratitude: [], mood: [] });
      byDay.get(key)!.gratitude.push(e.value);
    }
    for (const e of filteredMoodEntries) {
      const key = formatChartDate(new Date(e.createdAt), i18n.language, false);
      const existing = byDay.get(key);
      if (existing) existing.mood.push(e.value);
    }
    return Array.from(byDay.entries())
      .filter(([, v]) => v.mood.length > 0)
      .map(([date, v]) => ({
        date,
        gratitude: v.gratitude.reduce((s, x) => s + x, 0) / v.gratitude.length,
        mood: v.mood.reduce((s, x) => s + x, 0) / v.mood.length,
        _values: { gratitude: v.gratitude, mood: v.mood },
      }))
      .slice(-100);
  }, [filteredEntries, filteredMoodEntries, i18n.language]);

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

      <TrendPreview
        title={t("trendPreview.title")}
        label={t("trendPreview.days", { active: activeDays, total: 7 })}
        days={last7}
        accentClassName="text-accent"
        icon={<Heart aria-hidden="true" className="w-4 h-4 text-accent" />}
        expanded={chartOpen}
        onToggle={() => setChartOpen((o) => !o)}
        showLabel={t("trendPreview.show")}
        hideLabel={t("trendPreview.hide")}
        disabled={(entries?.length ?? 0) === 0}
      >
        <div className="flex justify-center mb-3">
          <PeriodSelector
            options={GRATITUDE_PERIODS.map((p) => ({ key: p.key, label: p.label }))}
            value={period}
            onChange={setPeriod}
            size="sm"
          />
        </div>
        {correlationData.length > 0 ? (
          <Chart
            type="line"
            noCard
            data={correlationData}
            series={[
              {
                dataKey: "gratitude",
                color: "hsl(var(--accent))",
                label: t("dashboard.gratitude"),
              },
              { dataKey: "mood", color: "hsl(var(--primary))", label: t("dashboard.mood") },
            ]}
            xKey="date"
            title={t("dashboard.gratitudeRelationTitle")}
            icon={<Smile aria-hidden="true" className="w-4 h-4 text-primary" />}
            showLegend
            height={160}
            showDots={false}
          />
        ) : (
          <EmptyState icon={Heart} title={t("dashboard.gratitudeEmpty")} />
        )}
      </TrendPreview>

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
