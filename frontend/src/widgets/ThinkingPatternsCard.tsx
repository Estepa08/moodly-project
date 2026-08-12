import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { buildRadarComparison } from '../lib/radarDelta';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { RadarChart } from '../features/analytics';
import Spinner from '../components/ui/spinner';
import EmptyState from '../components/ui/empty-state';
import PeriodSelect from '../components/ui/PeriodSelect';
import { Period } from '../lib/constants';
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <Card className="shadow-neumorphic">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <BrainCircuit aria-hidden="true" className="w-4 h-4 text-primary" />
            {t('testResults.thinkingPatternsTitle')}
          </CardTitle>
          {comparison && (
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
          )}
        </div>
        <PeriodSelect value={period} onChange={onPeriodChange} className="w-full sm:w-44" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10" aria-label={t('dashboard.practicesLoading')}>
            <Spinner />
          </div>
        ) : comparison ? (
          <>
            <RadarChart data={comparison.current} previousData={comparison.previous} />
            {comparison.previous && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t('testResults.thinkingPatternsBetter')} · {t('testResults.thinkingPatternsWorse')}{' '}
                · {t('testResults.thinkingPatternsSame')}
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
      </CardContent>
    </Card>
  );
}
