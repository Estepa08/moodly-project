import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronDown } from 'lucide-react';
import { useTests } from '../hooks/useTests';
import { useTestResultText } from '../hooks/useTestResultText';
import type { DecryptedTestResult } from '../hooks/useTests';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LoadingCard } from '../components/ui/loading-card';
import EmptyState from '../components/ui/empty-state';
import { Button } from '../components/ui/button';
import PeriodSelect from '../components/ui/PeriodSelect';
import { Period } from '../lib/constants';
import { cn } from '../lib/utils';

type TestResult = DecryptedTestResult;

interface TestsResultsSectionProps {
  results: TestResult[];
  isLoading?: boolean;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

export default function TestsResultsSection({
  results,
  isLoading,
  period,
  onPeriodChange,
}: TestsResultsSectionProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { resolve } = useTestResultText();
  const { data: tests } = useTests();
  const [openTests, setOpenTests] = useState<Record<string, boolean>>({});
  const [openAttempt, setOpenAttempt] = useState<Record<string, boolean>>({});
  const [showFull, setShowFull] = useState<Record<string, boolean>>({});

  const titleMap = useMemo(() => {
    const map = new Map<string, string>();
    if (tests) {
      for (const test of tests) map.set(test.id, test.title);
    }
    return map;
  }, [tests]);

  const testName = (r: TestResult) =>
    (r as { testTitle?: string }).testTitle ?? titleMap.get(r.testId) ?? r.testId;

  const groups = useMemo(() => {
    if (!results) return [];
    const byTest = new Map<string, TestResult[]>();
    for (const r of results) {
      if (!byTest.has(r.testId)) byTest.set(r.testId, []);
      byTest.get(r.testId)!.push(r);
    }
    return Array.from(byTest.entries())
      .map(([testId, list]) => ({
        testId,
        results: [...list].sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
        ),
      }))
      .sort((a, b) => {
        const lastA = new Date(a.results[0].completedAt).getTime();
        const lastB = new Date(b.results[0].completedAt).getTime();
        return lastB - lastA;
      });
  }, [results]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US');

  if (isLoading) {
    return <LoadingCard className="shadow-neumorphic" />;
  }

  if (!results || results.length === 0) {
    return (
      <Card className="shadow-neumorphic">
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="w-4 h-4 text-primary" />
            {t('dashboard.testsTaken')}
          </CardTitle>
          <PeriodSelect value={period} onChange={onPeriodChange} className="w-full sm:w-44" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ClipboardList}
            title={t('dashboard.noTestData')}
            action={{
              label: t('testResults.takeTest'),
              onClick: () => navigate('/tests'),
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-neumorphic">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="w-4 h-4 text-primary" />
            {t('dashboard.testsTaken')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('testResults.summaryCount', { count: results.length })}
          </p>
        </div>
        <PeriodSelect value={period} onChange={onPeriodChange} className="w-full sm:w-44" />
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {groups.map((group) => {
          const latest = group.results[0];
          const open = !!openTests[group.testId];

          return (
            <div key={group.testId} className="rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setOpenTests((prev) => ({ ...prev, [group.testId]: !prev[group.testId] }))
                }
                aria-expanded={open}
                className="flex items-center gap-3 w-full px-3 py-2.5 min-h-[44px] text-left cursor-pointer rounded-xl transition-[background-color] duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{testName(latest)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {latest.interpretation} ·{' '}
                    {t('testResults.summaryCount', { count: group.results.length })}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums ml-2">{latest.score}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0',
                    open && 'rotate-180',
                  )}
                />
              </button>

              {open && (
                <div className="border-t border-border bg-muted/20 px-2 py-2 space-y-1.5">
                  {group.results.map((r) => {
                    const attemptOpen = !!openAttempt[r.id];
                    const { interpretationText, recommendationText } = resolve(r);
                    const isLongText = interpretationText.length > 100;

                    return (
                      <div
                        key={r.id}
                        className="rounded-xl bg-card border border-border overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenAttempt((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                          }
                          aria-expanded={attemptOpen}
                          className="flex items-center gap-3 w-full px-3 py-2 min-h-[44px] text-left cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground">
                              {formatDate(r.completedAt)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.interpretation}
                            </p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums ml-2">{r.score}</span>
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              'w-4 h-4 text-muted-foreground transition-transform duration-150 shrink-0',
                              attemptOpen && 'rotate-180',
                            )}
                          />
                        </button>

                        {attemptOpen && (
                          <div className="px-3 pb-3">
                            <div className={showFull[r.id] ? '' : 'line-clamp-2'}>
                              <p className="text-sm">{interpretationText}</p>
                            </div>
                            {isLongText && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto px-0 text-xs"
                                aria-expanded={!!showFull[r.id]}
                                onClick={() =>
                                  setShowFull((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                                }
                              >
                                {showFull[r.id]
                                  ? t('testResults.showLess')
                                  : t('testResults.showFull')}
                              </Button>
                            )}
                            <p className="text-sm mt-2 text-muted-foreground">
                              {recommendationText}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
