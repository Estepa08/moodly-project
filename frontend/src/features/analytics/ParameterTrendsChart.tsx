import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { Chart } from '../../lib/chart';
import { PARAM_COLORS, PARAM_NAME_KEYS, Period } from '../../lib/constants';
import type { ParameterName } from '../../lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LoadingCard } from '../../components/ui/loading-card';
import { Chip } from '../../components/ui/chip';
import PeriodSelect from '../../components/ui/PeriodSelect';

interface ParameterTrendsChartProps {
  trendData: Record<string, unknown>[];
  paramNames: string[];
  isLoading: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export default function ParameterTrendsChart({
  trendData,
  paramNames,
  isLoading,
  period,
  onPeriodChange,
}: ParameterTrendsChartProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const defaultParam = paramNames.includes('Mood') ? 'Mood' : paramNames[0];
  const [visibleParams, setVisibleParams] = useState<Set<string>>(
    () => new Set(defaultParam ? [defaultParam] : []),
  );

  const toggleVisible = (name: string) => {
    setVisibleParams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const visibleHasData = trendData.some((row) => [...visibleParams].some((p) => row[p] != null));

  if (isLoading) {
    return <LoadingCard className="border-0 shadow-none" />;
  }

  const visibleSeries = paramNames
    .filter((name) => visibleParams.has(name))
    .map((name) => ({
      dataKey: name,
      color: PARAM_COLORS[name as ParameterName] ?? 'hsl(var(--primary))',
      label: t(PARAM_NAME_KEYS[name as ParameterName] ?? name),
    }));

  return (
    <Card className="shadow-neumorphic">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{t('dashboard.parameterTrends')}</CardTitle>
        <PeriodSelect value={period} onChange={onPeriodChange} className="w-full sm:w-44" />
      </CardHeader>
      <CardContent>
        {trendData.length === 0 ? (
          <Chart
            type="line"
            data={[]}
            series={[]}
            xKey="date"
            title=""
            noCard
            emptyMessage={t('dashboard.noTrendData')}
            emptyIcon={BarChart3}
          />
        ) : (
          <>
            <Chart
              type="line"
              data={trendData}
              series={visibleSeries}
              xKey="date"
              xType="number"
              xTickFormatter={(value) =>
                new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
              }
              tooltipLabelFormatter={(value) =>
                new Date(value).toLocaleString(locale, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
              title=""
              noCard
              formatTooltip={(name, value) => {
                const label = t(PARAM_NAME_KEYS[name as ParameterName] ?? name);
                return `${label}: ${value}`;
              }}
              height={220}
              yDomain={[0, 10]}
            />

            <table className="sr-only" aria-label={t('dashboard.parameterTrends')}>
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  {[...visibleParams].map((name) => (
                    <th key={name}>{t(PARAM_NAME_KEYS[name as ParameterName] ?? name)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trendData.map((row: Record<string, unknown>, i) => (
                  <tr key={i}>
                    <td>{row.dateLabel as string}</td>
                    {[...visibleParams].map((name) => (
                      <td key={name}>{row[name] != null ? String(row[name]) : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleParams.size > 0 && !visibleHasData && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {t('dashboard.noEntries')}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {paramNames.map((name) => {
                const isVisible = visibleParams.has(name);
                return (
                  <Chip
                    key={name}
                    aria-pressed={isVisible}
                    variant={isVisible ? 'active' : 'default'}
                    onClick={() => toggleVisible(name)}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          PARAM_COLORS[name as ParameterName] ?? 'hsl(var(--primary))',
                      }}
                    />
                    {t(PARAM_NAME_KEYS[name as ParameterName] ?? name)}
                  </Chip>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
