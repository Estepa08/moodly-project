import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { PARAM_ICONS, PARAM_NAME_KEYS, NEGATIVE_VALENCE_PARAMS, Trend } from '../../lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LoadingCard } from '../../components/ui/loading-card';
import EmptyState from '../../components/ui/empty-state';
import type { ParameterName } from '../../lib/constants';
import { isImprovement } from './analytics.utils';

interface WeeklyAverage {
  name: string;
  average: number | null;
  trend: Trend;
}
interface WeeklyAveragesGridProps {
  weeklyAverages: WeeklyAverage[];
  isLoading: boolean;
}

export default function WeeklyAveragesGrid({ weeklyAverages, isLoading }: WeeklyAveragesGridProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.weeklyAverages')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingCard className="border-0 shadow-none" />
        ) : weeklyAverages.length === 0 ? (
          <EmptyState icon={BarChart3} title={t('dashboard.noAveragesYet')} />
        ) : (
          <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
            {weeklyAverages.map((avg) => {
              const Icon = PARAM_ICONS[avg.name as ParameterName];
              const averageValue = avg.average;
              const isNegative = NEGATIVE_VALENCE_PARAMS.has(avg.name as ParameterName);
              const goodness =
                averageValue === null ? null : isNegative ? 10 - averageValue : averageValue;
              const colorClass =
                goodness !== null
                  ? goodness >= 7
                    ? 'text-primary'
                    : goodness >= 4
                      ? 'text-primary-muted'
                      : 'text-primary-dim'
                  : 'text-muted-foreground';
              const TrendIcon =
                avg.trend === Trend.Up
                  ? TrendingUp
                  : avg.trend === Trend.Down
                    ? TrendingDown
                    : Minus;
              const trendSign = avg.trend === Trend.Up ? 1 : avg.trend === Trend.Down ? -1 : 0;
              const trendIsGood =
                avg.trend === Trend.Flat ? null : isImprovement(trendSign, isNegative);
              const trendColor =
                trendIsGood === null
                  ? 'text-muted-foreground'
                  : trendIsGood
                    ? 'text-primary'
                    : 'text-primary-dim';
              return (
                <div
                  key={avg.name}
                  className="rounded-xl bg-card shadow-neumorphic-sm p-3 max-sm:p-2"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {Icon && <Icon aria-hidden="true" className="w-4 h-4 text-primary" />}
                    <span className="text-xs text-muted-foreground">
                      {t(PARAM_NAME_KEYS[avg.name as ParameterName] ?? avg.name)}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`text-2xl font-bold font-serif ${colorClass}`}>
                      {averageValue !== null ? averageValue.toFixed(1) : '—'}
                    </span>
                    {averageValue !== null && (
                      <TrendIcon aria-hidden="true" className={`w-4 h-4 mb-1 ${trendColor}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
