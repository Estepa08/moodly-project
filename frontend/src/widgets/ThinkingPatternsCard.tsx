import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { buildRadarComparison, summarizeRadarTrend } from '../lib/radarDelta';
import { RadarChart } from '../features/analytics';
import EmptyState from '../components/ui/empty-state';
import PeriodCardShell from '../components/ui/PeriodCardShell';
import { Period } from '../lib/constants';
import { cn } from '../lib/utils';
import type { components } from '../lib/api-types';

type TestResult = components['schemas']['TestResult'];

interface ThinkingPatternsCardProps {
  results: TestResult[];
  isLoading?: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export default function ThinkingPatternsCard({
  results,
  isLoading,
  period,
  onPeriodChange,
}: ThinkingPatternsCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const comparison = useMemo(() => buildRadarComparison(results), [results]);
  // Переиспользуем ту же сумму сдвигов, что уже посчитана для сравнения на
  // радар-графике (Сессия 10, three-personas-design-gaps.md) — не пересчитываем
  // результаты теста заново, только сворачиваем их в один вывод по тренду.
  const trend = useMemo(() => (comparison ? summarizeRadarTrend(comparison) : null), [comparison]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <PeriodCardShell
      icon={BrainCircuit}
      title={t('testResults.thinkingPatternsTitle')}
      subtitle={
        comparison && (
          <>
            <p className="text-xs text-muted-foreground">
              {comparison.previous
                ? t('testResults.thinkingPatternsCompare')
                : t('testResults.thinkingPatternsSingle')}
            </p>
            {comparison.previous && comparison.previousDate && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-[3px] bg-primary/60" aria-hidden="true" />
                  {t('testResults.thinkingPatternsLast', {
                    date: formatDate(comparison.currentDate),
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3 h-1.5 border-t-2 border-dashed border-muted-foreground"
                    aria-hidden="true"
                  />
                  {t('testResults.thinkingPatternsPrevious', {
                    date: formatDate(comparison.previousDate),
                  })}
                </span>
              </div>
            )}
          </>
        )
      }
      period={period}
      onPeriodChange={onPeriodChange}
      isLoading={isLoading}
    >
      {comparison ? (
        <>
          <RadarChart data={comparison.current} previousData={comparison.previous} />
          {trend && (
            <p
              className={cn(
                'mt-3 text-sm font-bold',
                trend === 'better' && 'text-success',
                trend === 'worse' && 'text-destructive',
                trend === 'same' && 'text-muted-foreground',
              )}
            >
              {t(`testResults.thinkingPatternsTrend.${trend}`)}
            </p>
          )}
          {comparison.previous && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('testResults.thinkingPatternsBetter')} · {t('testResults.thinkingPatternsWorse')} ·{' '}
              {t('testResults.thinkingPatternsSame')}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t('testResults.thinkingPatternsLibraryHint')}
          </p>
        </>
      ) : (
        <EmptyState
          icon={BrainCircuit}
          title={t('testResults.thinkingPatternsEmptyTitle')}
          description={t('testResults.thinkingPatternsEmptyDesc')}
          action={{
            label: t('testResults.takeTest'),
            onClick: () => navigate('/tests'),
          }}
          className="py-8"
        />
      )}
    </PeriodCardShell>
  );
}
