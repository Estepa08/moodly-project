import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useDashboardData, PERIODS } from "../hooks/useDashboardData";
import { Period } from "../lib/constants";
import PeriodSelector from "../components/ui/PeriodSelector";
import { ParameterTrendsChart } from "../features/analytics";
import { WellbeingCard, WeeklyDigest, PendingEntryBanner } from "../widgets";

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
    trendData,
    paramNames,
    wellbeing,
    isDataLoading,
    numericParams,
    createEntry,
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

      <PendingEntryBanner
        numericParams={numericParams}
        createEntry={createEntry}
      />

      <WellbeingCard
        average={wellbeing.average}
        trend={wellbeing.trend}
        isLoading={isDataLoading}
      />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-primary/30" />
          <h3 className="text-base font-semibold text-foreground">
            {t("dashboard.parameterTrends")}
          </h3>
        </div>
        <ParameterTrendsChart
          trendData={trendData}
          paramNames={paramNames}
          isLoading={isDataLoading}
        />
      </div>

      <WeeklyDigest />
    </div>
  );
}
