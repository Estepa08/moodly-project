import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Sparkles, Radar, ArrowRight } from "lucide-react";
import { useDashboardData, PERIODS } from "../hooks/useDashboardData";
import { Period } from "../lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import PeriodSelector from "../components/ui/PeriodSelector";
import { RadarChart } from "../features/analytics";
import { QuickEntryIcons } from "../features/mood-entry";
import { ParameterTrendsChart } from "../features/analytics";
import { WeeklyAveragesGrid } from "../features/analytics";
import { PracticeProgress } from "../features/gamification";
import { WellbeingCard } from "../widgets";
import CollapsibleSection from "../components/ui/collapsible-section";
import EmptyState from "../components/ui/empty-state";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>(Period.TwoWeeks);

  const periodOptions = useMemo(
    () => PERIODS.map((p) => ({ key: p.key, label: t(p.labelKey) })),
    [t],
  );

  const {
    numericParams,
    trendData,
    paramNames,
    wellbeing,
    weeklyAverages,
    entriesByParam,
    creatureState,
    radarData,
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
          onChange={(key) => setPeriod(key as Period)}
        />
      </div>

      <QuickEntryIcons
        numericParams={numericParams}
        createEntry={createEntry}
        hasEntries={(numericParams ?? []).some(
          (p) => (entriesByParam.get(p.name) ?? []).length > 0,
        )}
      />

      <CollapsibleSection
        title={t("dashboard.practicesSummary")}
        icon={Sparkles}
        defaultOpen
        storageKey="moodly_collapse_practices"
      >
        <PracticeProgress breathingSessionCount={creatureState?.sessionCount} />
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => navigate("/practices")}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-1"
          >
            {t("dashboard.allPractices")}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CollapsibleSection>

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
          <button
            onClick={() => navigate("/reports")}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-1"
          >
            {t("dashboard.allReports")}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CollapsibleSection>

      {radarData.length > 0 ? (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.cdProfile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadarChart data={radarData} />
            <button
              onClick={() => navigate("/distortions")}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-1.5"
            >
              {t("dashboard.goToDistortions")}
              <ArrowRight className="w-3 h-3" />
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <EmptyState icon={Radar} title={t("dashboard.cdProfileEmpty")} />
          <button
            onClick={() => navigate("/tests")}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-3 py-1.5"
          >
            {t("dashboard.takeTest")}
          </button>
        </div>
      )}

      <CollapsibleSection
        title={t("dashboard.weeklyAverages")}
        defaultOpen={false}
        storageKey="moodly_collapse_averages"
      >
        <WeeklyAveragesGrid weeklyAverages={weeklyAverages} isLoading={isDataLoading} />
      </CollapsibleSection>
    </div>
  );
}
