import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useParameters } from "../../hooks/useParameters";
import { useEntries } from "../../hooks/useEntries";
import { ACTIVITY_CATALOG } from "../../lib/dayActivities";
import { computeActivityCorrelation, CORRELATION_WINDOW_DAYS } from "../../lib/activityCorrelation";

export default function ActivityCorrelationCard() {
  const { t } = useTranslation();
  const { data: params } = useParameters();

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - CORRELATION_WINDOW_DAYS);
    return { from: start.toISOString(), to: end.toISOString() };
  }, []);

  const { data: entries, isLoading } = useEntries(dateRange);

  const paramNameById = useMemo(() => {
    const map = new Map<string, string>();
    if (params) {
      for (const p of params) map.set(p.id, p.name);
    }
    return (id: string) => map.get(id);
  }, [params]);

  const labelFor = useMemo(
    () => (key: string, customLabel?: string) => {
      if (key.startsWith("custom:")) return customLabel ?? key;
      const def = ACTIVITY_CATALOG.find((a) => a.key === key);
      return def ? t(def.labelKey) : key;
    },
    [t],
  );

  const correlation = useMemo(() => {
    if (!entries) return null;
    return computeActivityCorrelation(entries, paramNameById, labelFor);
  }, [entries, paramNameById, labelFor]);

  const formatMood = (v: number) => v.toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 aria-hidden="true" className="w-4 h-4 text-accent" />
          {t("dayActivities.correlationTitle")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("dayActivities.correlationSubtitle")}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !correlation || !correlation.sufficient ? (
          <p className="text-sm text-muted-foreground">
            {t("dayActivities.correlationInsufficient")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="flex items-center gap-1 text-xs font-semibold text-green-600 mb-2">
                <TrendingUp aria-hidden="true" className="w-3.5 h-3.5" />
                {t("dayActivities.correlationUp")}
              </h4>
              {correlation.up.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-2">
                  {correlation.up.map((s) => (
                    <li key={s.key} className="text-sm">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingUp aria-hidden="true" className="w-3 h-3" />+{formatMood(s.lift)}
                        <span className="text-muted-foreground">
                          ·{" "}
                          {t("dayActivities.correlationDays", {
                            count: s.days,
                            value: formatMood(s.avgMood),
                          })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="flex items-center gap-1 text-xs font-semibold text-red-500 mb-2">
                <TrendingDown aria-hidden="true" className="w-3.5 h-3.5" />
                {t("dayActivities.correlationDown")}
              </h4>
              {correlation.down.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-2">
                  {correlation.down.map((s) => (
                    <li key={s.key} className="text-sm">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <TrendingDown aria-hidden="true" className="w-3 h-3" />
                        {formatMood(s.lift)}
                        <span className="text-muted-foreground">
                          ·{" "}
                          {t("dayActivities.correlationDays", {
                            count: s.days,
                            value: formatMood(s.avgMood),
                          })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
