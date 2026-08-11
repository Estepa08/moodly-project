import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import PeriodSelect from "../components/ui/PeriodSelect";
import Spinner from "../components/ui/spinner";
import { Period } from "../lib/constants";
import { getDateRange } from "../lib/utils";
import { useEntries } from "../hooks/useEntries";
import { useParameters } from "../hooks/useParameters";
import { computeDistortionStats, type DistortionStat } from "../lib/distortionStats";

interface DistortionStatsCardProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export default function DistortionStatsCard({ period, onPeriodChange }: DistortionStatsCardProps) {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const range = useMemo(() => getDateRange(period), [period]);
  const { data: entries, isLoading } = useEntries(range);

  const paramNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of params ?? []) map.set(p.id, p.name);
    return (id: string) => map.get(id);
  }, [params]);

  const result = useMemo(() => {
    if (!entries) return null;
    return computeDistortionStats(entries, paramNameById);
  }, [entries, paramNameById]);

  const formatMood = (v: number) => v.toFixed(1);

  const renderRow = (s: DistortionStat) => {
    const positive = s.moodDelta !== null && s.moodDelta > 0;
    return (
      <div
        key={s.key}
        className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            #{t(`cognitiveDistortions.${s.key}`)}
          </p>
          {s.avgMood !== null && s.moodDelta !== null && (
            <p className="text-xs text-muted-foreground">
              {t("distortionStats.moodVsBaseline", {
                value: formatMood(s.avgMood),
                delta: `${positive ? "+" : ""}${formatMood(s.moodDelta)}`,
              })}
            </p>
          )}
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{ color: "#7B5BF2", backgroundColor: "#EDE7FC" }}
        >
          {s.count}
        </span>
      </div>
    );
  };

  return (
    <Card className="shadow-neumorphic">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <BrainCircuit aria-hidden="true" className="w-4 h-4 text-accent" />
            {t("distortionStats.title")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{t("distortionStats.subtitle")}</p>
        </div>
        <PeriodSelect value={period} onChange={onPeriodChange} className="w-full sm:w-44" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10" aria-label={t("dashboard.practicesLoading")}>
            <Spinner />
          </div>
        ) : result && result.sufficient ? (
          <div className="space-y-3">
            {result.baseline !== null && (
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  {t("distortionStats.baseline", { value: formatMood(result.baseline) })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("distortionStats.taggedDays", { count: result.stats.length })}
                </span>
              </div>
            )}
            <div className="space-y-2">{result.stats.slice(0, 5).map(renderRow)}</div>
            <p className="text-xs text-muted-foreground">{t("distortionStats.statsHint")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-muted shadow-neumorphic-inset flex items-center justify-center mb-4">
              <BrainCircuit aria-hidden="true" className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {t("distortionStats.emptyTitle")}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {t("distortionStats.emptyDesc")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
