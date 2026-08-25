import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BrainCircuit, ChevronRight } from 'lucide-react';
import PeriodCardShell from '../components/ui/PeriodCardShell';
import PullQuote from '../components/ui/pull-quote';
import { Period } from '../lib/constants';
import { getDateRange } from '../lib/utils';
import { useEntries } from '../hooks/useEntries';
import { useParameters } from '../hooks/useParameters';
import { computeDistortionStats, type DistortionStat } from '../lib/distortionStats';

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
      <Link
        key={s.key}
        to={`/practices/thought-journal?distortion=${s.key}`}
        aria-label={t('distortionStats.workOnThis', { name: t(`cognitiveDistortions.${s.key}`) })}
        className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5 transition-[opacity,transform] duration-150 hover:bg-muted active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            #{t(`cognitiveDistortions.${s.key}`)}
          </p>
          {s.avgMood !== null && s.moodDelta !== null && (
            <p className="text-xs text-muted-foreground">
              {t('distortionStats.moodVsBaseline', {
                value: formatMood(s.avgMood),
                delta: `${positive ? '+' : ''}${formatMood(s.moodDelta)}`,
              })}
            </p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
            {s.count}
          </span>
          <ChevronRight aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
        </span>
      </Link>
    );
  };

  return (
    <PeriodCardShell
      icon={BrainCircuit}
      iconClassName="w-4 h-4 text-accent"
      title={t('distortionStats.title')}
      subtitle={<p className="text-xs text-muted-foreground">{t('distortionStats.subtitle')}</p>}
      period={period}
      onPeriodChange={onPeriodChange}
      isLoading={isLoading}
    >
      {result && result.sufficient ? (
        <div className="space-y-3">
          {result.baseline !== null && (
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {t('distortionStats.baseline', { value: formatMood(result.baseline) })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('distortionStats.taggedDays', { count: result.stats.length })}
              </span>
            </div>
          )}
          <div className="space-y-2">{result.stats.slice(0, 5).map(renderRow)}</div>
          <PullQuote>{t('distortionStats.statsHint')}</PullQuote>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-muted shadow-neumorphic-inset flex items-center justify-center mb-4">
            <BrainCircuit aria-hidden="true" className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {t('distortionStats.emptyTitle')}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">{t('distortionStats.emptyDesc')}</p>
        </div>
      )}
    </PeriodCardShell>
  );
}
