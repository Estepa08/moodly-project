import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Moon } from "lucide-react";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry, useUpdateEntry } from "../hooks/useEntries";
import { useRewardPractice, PracticeSource } from "../features/gamification";
import { SleepHygieneChecklist } from "../features/check-in";
import { SleepHygieneChart } from "../features/check-in";
import { TrendPreview } from "../features/analytics";
import PeriodSelector from "../components/ui/PeriodSelector";
import { formatChartDate } from "../lib/utils";

const SLEEP_PERIODS = [
  { key: "7d", label: "7d" },
  { key: "14d", label: "14d" },
  { key: "30d", label: "30d" },
] as const;

export default function SleepHygienePage() {
  const { t, i18n } = useTranslation();
  const { data: params } = useParameters();
  const [sleepPeriod, setSleepPeriod] = useState<string>("7d");
  const [chartOpen, setChartOpen] = useState(false);
  const hygieneParam = useMemo(() => params?.find((p) => p.name === "Sleep Hygiene"), [params]);
  const sleepParam = useMemo(() => params?.find((p) => p.name === "Sleep"), [params]);

  const { data: hygieneEntries } = useEntries(
    hygieneParam ? { parameterId: hygieneParam.id } : undefined,
  );
  const { data: sleepEntries } = useEntries(
    sleepParam ? { parameterId: sleepParam.id } : undefined,
  );
  const rewardPractice = useRewardPractice();
  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.SleepHygiene);
  });
  const updateEntry = useUpdateEntry();

  const last7 = useMemo(() => {
    const arr: (number | null)[] = new Array(7).fill(null);
    for (const h of hygieneEntries ?? []) {
      const dayIndex = Math.floor((Date.now() - new Date(h.createdAt).getTime()) / 86_400_000);
      if (dayIndex >= 0 && dayIndex < 7) {
        const idx = 6 - dayIndex;
        arr[idx] = (arr[idx] ?? 0) + 1;
      }
    }
    return arr;
  }, [hygieneEntries]);

  const activeDays = last7.filter((v): v is number => v !== null).length;

  const sleepChartData = useMemo(() => {
    const periodDays = parseInt(sleepPeriod.replace("d", ""));
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
    const entriesList = (sleepEntries ?? []).filter(
      (e) => new Date(e.createdAt).getTime() >= cutoff,
    );
    const grouped = new Map<string, { habits: number[]; sleep: number[] }>();
    for (const e of entriesList) {
      const day = formatChartDate(new Date(e.createdAt), i18n.language, false);
      if (!grouped.has(day)) grouped.set(day, { habits: [], sleep: [] });
      grouped.get(day)!.sleep.push(e.value);
    }
    for (const h of hygieneEntries ?? []) {
      const day = formatChartDate(new Date(h.createdAt), i18n.language, false);
      const g = grouped.get(day);
      if (g) g.habits.push(h.value);
    }
    return Array.from(grouped.entries()).map(([date, v]) => ({
      date,
      habits: v.habits.length > 0 ? v.habits.reduce((s, x) => s + x, 0) / v.habits.length : 0,
      sleep: v.sleep.reduce((s, x) => s + x, 0) / v.sleep.length,
      _values: {
        habits: v.habits.length > 0 ? v.habits : undefined,
        sleep: v.sleep.length > 1 ? v.sleep : undefined,
      },
    }));
  }, [sleepEntries, hygieneEntries, i18n.language, sleepPeriod]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("sleepHygiene.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("sleepHygiene.subtitle")}</p>
      </div>

      <TrendPreview
        title={t("trendPreview.title")}
        label={t("trendPreview.days", { active: activeDays, total: 7 })}
        days={last7}
        icon={<Moon aria-hidden="true" className="w-4 h-4 text-primary" />}
        expanded={chartOpen}
        onToggle={() => setChartOpen((o) => !o)}
        showLabel={t("trendPreview.show")}
        hideLabel={t("trendPreview.hide")}
        disabled={(hygieneEntries?.length ?? 0) === 0 && (sleepEntries?.length ?? 0) === 0}
      >
        <div className="flex justify-center mb-3">
          <PeriodSelector
            options={SLEEP_PERIODS.map((p) => ({ key: p.key, label: p.label }))}
            value={sleepPeriod}
            onChange={setSleepPeriod}
            size="sm"
          />
        </div>
        <SleepHygieneChart data={sleepChartData} />
      </TrendPreview>

      <SleepHygieneChecklist
        parameterId={hygieneParam?.id}
        hygieneEntries={hygieneParam ? (hygieneEntries ?? []) : []}
        createEntry={createEntry}
        updateEntry={updateEntry}
      />
    </div>
  );
}
