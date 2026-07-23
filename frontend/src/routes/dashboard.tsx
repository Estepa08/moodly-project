import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDashboardData, PERIODS } from "../hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import RadarChart from "../components/RadarChart";
import QuickEntryIcons from "../components/QuickEntryIcons";
import RecommendedPractice from "../components/RecommendedPractice";
import ParameterTrendsChart from "../components/ParameterTrendsChart";
import WeeklyAveragesGrid from "../components/WeeklyAveragesGrid";
import TestTimeline from "../components/TestTimeline";
import PracticesSummary from "../components/PracticesSummary";
import WellbeingCard from "../components/WellbeingCard";

export default function Dashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("2w");

  const {
    numericParams,
    trendData,
    paramNames,
    wellbeing,
    weeklyAverages,
    entriesByParam,
    creatureState,
    radarData,
    testTimeline,
    createEntry,
    isDataLoading,
    resultsLoading,
  } = useDashboardData(period);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground font-serif">
          {t("dashboard.dateRange")}
        </h2>
        <div className="flex items-center gap-1 bg-card rounded-xl shadow-neumorphic-sm p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              aria-pressed={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                period === p.key
                  ? "bg-primary text-primary-foreground shadow-neumorphic-sm"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <QuickEntryIcons
        numericParams={numericParams}
        createEntry={createEntry}
      />

      <RecommendedPractice />

      <ParameterTrendsChart
        trendData={trendData}
        paramNames={paramNames}
        isLoading={isDataLoading}
      />

      <WellbeingCard
        average={wellbeing.average}
        trend={wellbeing.trend}
        isLoading={isDataLoading}
      />

      <WeeklyAveragesGrid weeklyAverages={weeklyAverages} isLoading={isDataLoading} />

      <PracticesSummary
        gratitudeEntries={entriesByParam.get("Gratitude") ?? []}
        hygieneEntries={entriesByParam.get("Sleep Hygiene") ?? []}
        distortionEntries={entriesByParam.get("Distortion Quiz") ?? []}
        breathingSessionCount={creatureState?.sessionCount}
        isLoading={isDataLoading}
      />

      {radarData.length > 0 && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.cdProfile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart data={radarData} />
          </CardContent>
        </Card>
      )}

      <TestTimeline testTimeline={testTimeline} isLoading={resultsLoading} />
    </div>
  );
}
