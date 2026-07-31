import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useDashboardData, PERIODS } from "../hooks/useDashboardData";
import { useEntries } from "../hooks/useEntries";
import { Period } from "../lib/constants";
import PeriodSelector from "../components/ui/PeriodSelector";
import { ParameterTrendsChart } from "../features/analytics";
import { QuickEntryIcons } from "../features/mood-entry";
import { WellbeingCard, TestsTakenCard } from "../widgets";
import CompanionCard from "../features/gamification/CompanionCard";

const WELLBEING_PANEL_ID = "wellbeing-panel";
const WELLBEING_OPEN_KEY = "moodly_wellbeing_open";

function readWellbeingOpen(): boolean {
  try {
    const stored = localStorage.getItem(WELLBEING_OPEN_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    /* localStorage may be unavailable */
  }
  return true;
}

function persistWellbeingOpen(open: boolean) {
  try {
    localStorage.setItem(WELLBEING_OPEN_KEY, open ? "1" : "0");
  } catch {
    /* localStorage may be unavailable */
  }
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPeriod = (Object.values(Period) as string[]).includes(
    searchParams.get("period") ?? "",
  )
    ? (searchParams.get("period") as Period)
    : Period.TwoWeeks;
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [expanded, setExpanded] = useState<boolean>(readWellbeingOpen);

  const periodOptions = useMemo(
    () => PERIODS.map((p) => ({ key: p.key, label: t(p.labelKey) })),
    [t],
  );

  const { trendData, paramNames, wellbeing, isDataLoading, numericParams, createEntry } =
    useDashboardData(period);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() + 1);
    return d;
  }, [todayStart]);

  const { data: todayEntries, isLoading: todayLoading } = useEntries({
    from: todayStart.toISOString(),
    to: todayEnd.toISOString(),
  });

  const coreParamIds = useMemo(
    () =>
      numericParams
        ?.filter((p) => ["Mood", "Energy", "Sleep", "Anxiety"].includes(p.name))
        .map((p) => p.id) ?? [],
    [numericParams],
  );

  const hasAllToday = useMemo(
    () =>
      coreParamIds.length > 0 &&
      coreParamIds.every((id) => todayEntries?.some((e) => e.parameterId === id)),
    [coreParamIds, todayEntries],
  );

  const savedTodayParamIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of todayEntries ?? []) ids.add(e.parameterId);
    return ids;
  }, [todayEntries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground font-serif">
          {t("dashboard.dateRange")}
        </h2>
        <PeriodSelector
          options={periodOptions}
          value={period}
          onChange={(key) => {
            setPeriod(key as Period);
            setSearchParams({ period: key }, { replace: true });
          }}
        />
      </div>

      <CompanionCard />

      <WellbeingCard
        average={wellbeing.average}
        trend={wellbeing.trend}
        isLoading={isDataLoading}
        expanded={expanded}
        onToggle={() => {
          setExpanded((v) => {
            const next = !v;
            persistWellbeingOpen(next);
            return next;
          });
        }}
        panelId={WELLBEING_PANEL_ID}
      />

      {expanded && (
        <div
          id={WELLBEING_PANEL_ID}
          className="animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {todayLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasAllToday ? (
            <ParameterTrendsChart
              trendData={trendData}
              paramNames={paramNames}
              isLoading={isDataLoading}
            />
          ) : (
            <QuickEntryIcons
              createEntry={createEntry}
              numericParams={numericParams}
              savedTodayParamIds={savedTodayParamIds}
            />
          )}
        </div>
      )}

      <TestsTakenCard />
    </div>
  );
}
