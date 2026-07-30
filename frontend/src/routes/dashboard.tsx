import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { useDashboardData, PERIODS } from "../hooks/useDashboardData";
import { Period } from "../lib/constants";
import PeriodSelector from "../components/ui/PeriodSelector";
import { QuickEntryIcons } from "../features/mood-entry";
import { ParameterTrendsChart } from "../features/analytics";
import { PracticeProgress } from "../features/gamification";
import { WellbeingCard } from "../widgets";
import CollapsibleSection from "../components/ui/collapsible-section";

export default function Dashboard() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPeriod = (Object.values(Period) as string[]).includes(
    searchParams.get("period") ?? "",
  )
    ? (searchParams.get("period") as Period)
    : Period.TwoWeeks;
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const periodOptions = useMemo(
    () => PERIODS.map((p) => ({ key: p.key, label: t(p.labelKey) })),
    [t],
  );

  const {
    numericParams,
    trendData,
    paramNames,
    wellbeing,
    creatureState,
    createEntry,
    isDataLoading,
  } = useDashboardData(period);

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

      <CollapsibleSection
        title={t("dashboard.practicesSummary")}
        icon={Sparkles}
        defaultOpen
        storageKey="moodly_collapse_practices"
      >
        <PracticeProgress breathingSessionCount={creatureState?.sessionCount} />
        <div className="mt-2 flex justify-end">
          <Link
            to="/practices"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-1"
          >
            {t("dashboard.allPractices")}
            <ArrowRight aria-hidden="true" className="w-3 h-3" />
          </Link>
        </div>
      </CollapsibleSection>

      <QuickEntryIcons
        numericParams={numericParams}
        createEntry={createEntry}
      />

      <CollapsibleSection
        title={t("dashboard.parameterTrends")}
        icon={TrendingUp}
        defaultOpen
        storageKey="moodly_collapse_trends"
      >
        <ParameterTrendsChart
          trendData={trendData}
          paramNames={paramNames}
          isLoading={isDataLoading}
        />

        <div className="mt-3">
          <WellbeingCard
            average={wellbeing.average}
            trend={wellbeing.trend}
            isLoading={isDataLoading}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <Link
            to="/reports"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-1"
          >
            {t("dashboard.allReports")}
            <ArrowRight aria-hidden="true" className="w-3 h-3" />
          </Link>
        </div>
      </CollapsibleSection>
    </div>
  );
}
