import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { useEntries } from '../hooks/useEntries';
import { useTestResults } from '../hooks/useTests';
import { Period } from '../lib/constants';
import { filterByPeriod } from '../lib/utils';
import { ParameterTrendsChart } from '../features/analytics';
import { QuickEntryIcons } from '../features/mood-entry';
import DayActivitiesCard from '../features/check-in/DayActivitiesCard';
import ActivityCorrelationCard from '../features/analytics/ActivityCorrelationCard';
import { WellbeingCard, FirstTimeHint } from '../widgets';
import TestsResultsSection from '../widgets/TestsResultsSection';
import ThinkingPatternsCard from '../widgets/ThinkingPatternsCard';
import CompanionCard from '../features/gamification/CompanionCard';

const WELLBEING_PANEL_ID = 'wellbeing-panel';
const WELLBEING_OPEN_KEY = 'moodly_wellbeing_open';

function readWellbeingOpen(): boolean {
  try {
    const stored = localStorage.getItem(WELLBEING_OPEN_KEY);
    if (stored !== null) return stored === '1';
  } catch {
    /* localStorage may be unavailable */
  }
  return true;
}

function persistWellbeingOpen(open: boolean) {
  try {
    localStorage.setItem(WELLBEING_OPEN_KEY, open ? '1' : '0');
  } catch {
    /* localStorage may be unavailable */
  }
}

const PERIOD_VALUES = Object.values(Period) as string[];

function readPeriodParam(value: string | null, fallback: Period): Period {
  return value && PERIOD_VALUES.includes(value) ? (value as Period) : fallback;
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expanded, setExpanded] = useState<boolean>(readWellbeingOpen);

  const period = useMemo(
    () => ({
      wellbeing: readPeriodParam(searchParams.get('wb'), Period.TwoWeeks),
      radar: readPeriodParam(searchParams.get('radar'), Period.TwoWeeks),
      tests: readPeriodParam(searchParams.get('tests'), Period.TwoWeeks),
    }),
    [searchParams],
  );

  const setPeriodParam = (name: string, value: Period) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(name, value);
        return next;
      },
      { replace: true },
    );
  };

  const { trendData, paramNames, wellbeing, isDataLoading, numericParams, createEntry } =
    useDashboardData(period.wellbeing);

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

  const { data: allTestResults, isLoading: resultsLoading } = useTestResults();

  const radarResults = useMemo(
    () => filterByPeriod(allTestResults, period.radar),
    [allTestResults, period.radar],
  );

  const testsResults = useMemo(
    () => filterByPeriod(allTestResults, period.tests),
    [allTestResults, period.tests],
  );

  const coreParamIds = useMemo(
    () =>
      numericParams
        ?.filter((p) => ['Mood', 'Energy', 'Sleep', 'Anxiety'].includes(p.name))
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

  const isFirstTime = useMemo(
    () => trendData.length === 0 && (allTestResults?.length ?? 0) === 0,
    [trendData, allTestResults],
  );

  return (
    <div className="space-y-4">
      <CompanionCard />

      <DayActivitiesCard />

      <ActivityCorrelationCard />

      <FirstTimeHint visible={isFirstTime} />

      <WellbeingCard
        average={wellbeing.average}
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
              period={period.wellbeing}
              onPeriodChange={(p) => setPeriodParam('wb', p)}
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

      <ThinkingPatternsCard
        results={radarResults ?? []}
        isLoading={resultsLoading}
        period={period.radar}
        onPeriodChange={(p) => setPeriodParam('radar', p)}
      />

      <TestsResultsSection
        results={testsResults ?? []}
        isLoading={resultsLoading}
        period={period.tests}
        onPeriodChange={(p) => setPeriodParam('tests', p)}
      />
    </div>
  );
}
