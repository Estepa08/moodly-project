import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, BarChart3, Moon, Sun, Zap, CloudLightning } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useParameters } from '../../hooks/useParameters';
import { useEntries } from '../../hooks/useEntries';
import { ACTIVITY_CATALOG } from '../../lib/dayActivities';
import {
  computeAllMetricCorrelations,
  CORRELATION_WINDOW_DAYS,
  MIN_ACTIVITY_DAYS,
  type CorrelationMetric,
} from '../../lib/activityCorrelation';
import type { ActivityScore } from '../../lib/activityCorrelation';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

const METRIC_META: Record<CorrelationMetric, { labelKey: string; Icon: LucideIcon }> = {
  mood: { labelKey: 'dayActivities.correlationTabMood', Icon: Sun },
  sleep: { labelKey: 'dayActivities.correlationTabSleep', Icon: Moon },
  energy: { labelKey: 'dayActivities.correlationTabEnergy', Icon: Zap },
  anxiety: { labelKey: 'dayActivities.correlationTabAnxiety', Icon: CloudLightning },
};

export default function ActivityCorrelationCard() {
  const { t } = useTranslation();
  const { data: params } = useParameters();
  const [active, setActive] = useState<CorrelationMetric>('mood');

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
      if (key.startsWith('custom:')) return customLabel ?? key;
      const def = ACTIVITY_CATALOG.find((a) => a.key === key);
      return def ? t(def.labelKey) : key;
    },
    [t],
  );

  const correlations = useMemo(() => {
    if (!entries) return null;
    return computeAllMetricCorrelations(entries, paramNameById, labelFor);
  }, [entries, paramNameById, labelFor]);

  const current = correlations?.[active];
  const meta = METRIC_META[active];

  const formatValue = (v: number) => v.toFixed(1);

  const scoreRows = (list: ActivityScore[], positive: boolean) => {
    if (list.length === 0) return <p className="text-xs text-muted-foreground">—</p>;
    return (
      <ul className="space-y-2">
        {list.map((s) => (
          <li key={s.key} className="text-sm">
            <span className="font-medium text-foreground">{s.label}</span>
            <div className="flex items-center gap-1 text-xs">
              <span className={positive ? 'text-green-600' : 'text-red-500'}>
                {positive ? '+' : ''}
                {formatValue(s.lift)}
              </span>
              <span className="text-muted-foreground">
                ·{' '}
                {t('dayActivities.correlationDays', {
                  count: s.days,
                  value: formatValue(s.avgValue),
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const metricLabel = t(`dayActivities.metric${active[0].toUpperCase()}${active.slice(1)}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 aria-hidden="true" className="w-4 h-4 text-accent" />
          {t('dayActivities.correlationTitle')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('dayActivities.correlationSubtitle')}</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
          {(Object.keys(METRIC_META) as CorrelationMetric[]).map((m) => {
            const mMeta = METRIC_META[m];
            const Icon = mMeta.Icon;
            const isActive = m === active;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActive(m)}
                aria-pressed={isActive}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon aria-hidden="true" className="w-3.5 h-3.5" />
                {t(mMeta.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !current || !current.sufficient ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('dayActivities.correlationInsufficient')}
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, (current?.daysTracked ?? 0) / MIN_ACTIVITY_DAYS) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                  {current?.daysTracked ?? 0}/{MIN_ACTIVITY_DAYS}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dayActivities.correlationInsufficientHint')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  {t('dayActivities.correlationBaseline', {
                    metric: metricLabel,
                    value: formatValue(current.baseline),
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('dayActivities.correlationTracked', { count: current.daysTracked })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-green-600 mb-2">
                    <TrendingUp aria-hidden="true" className="w-3.5 h-3.5" />
                    {t('dayActivities.correlationUp')}
                  </h4>
                  {scoreRows(current.up, true)}
                </div>
                <div>
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-red-500 mb-2">
                    <TrendingDown aria-hidden="true" className="w-3.5 h-3.5" />
                    {t('dayActivities.correlationDown')}
                  </h4>
                  {scoreRows(current.down, false)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
