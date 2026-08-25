import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DistortionKey } from '../../lib/distortionsQuiz';
import { cn } from '../../lib/utils';
import { isImprovement, isRegression } from './analytics.utils';

export interface DistortionEntry {
  key: DistortionKey;
  score: number;
}

interface Props {
  data: DistortionEntry[];
  previousData?: DistortionEntry[] | null;
  maxValue?: number;
  className?: string;
}

interface Row {
  key: DistortionKey;
  label: string;
  score: number;
  delta: number | null;
}

const LIBRARY_PATH = '/practices/distortions';

// Раньше здесь был radar-чарт (nivo) на 10 осях — на таком количестве категорий
// подписи и полигоны перекрывались и диаграмма читалась плохо. Список,
// отсортированный по величине изменения, показывает то же самое (что стало
// лучше/хуже) в одну ось считывания вместо десяти лучей.
export default function RadarChart({ data, previousData, maxValue, className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const max = maxValue ?? 9;

  const prevByKey = useMemo(() => {
    if (!previousData) return null;
    return new Map(previousData.map((d) => [d.key, d.score]));
  }, [previousData]);

  const rows = useMemo<Row[]>(() => {
    const built = data.map((d) => {
      const prev = prevByKey?.get(d.key);
      return {
        key: d.key,
        label: t(`cognitiveDistortions.${d.key}`),
        score: d.score,
        delta: prev !== undefined ? d.score - prev : null,
      };
    });
    // Есть с чем сравнить — ведём самыми заметными сдвигами (лучшие сверху).
    // Нет сравнения (первое прохождение) — ведём самыми выраженными искажениями.
    return prevByKey
      ? built.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
      : built.sort((a, b) => b.score - a.score);
  }, [data, prevByKey, t]);

  const maxAbsDelta = useMemo(
    () => Math.max(...rows.map((r) => Math.abs(r.delta ?? 0)), 1),
    [rows],
  );

  const onOpen = (event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(LIBRARY_PATH);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {rows.map((row, index) => {
        const hasDelta = row.delta !== null;
        // Искажения мышления — negative-valence метрика: рост score всегда хуже.
        const isGood = hasDelta && isImprovement(row.delta!, true);
        const isBad = hasDelta && isRegression(row.delta!, true);

        let deltaLabel = `${row.score}/${max}`;
        let deltaClass = 'text-muted-foreground';
        if (hasDelta) {
          if (isGood) {
            deltaLabel = `${row.delta} ↓`;
            deltaClass = 'text-success';
          } else if (isBad) {
            deltaLabel = `+${row.delta} ↑`;
            deltaClass = 'text-destructive';
          } else {
            deltaLabel = '0';
          }
        }

        const fillWidth = hasDelta
          ? (Math.abs(row.delta!) / maxAbsDelta) * 50
          : (row.score / max) * 100;

        return (
          <div
            key={row.key}
            className={cn('py-2.5', index > 0 && 'border-t border-dashed')}
            style={index > 0 ? { borderColor: 'hsl(var(--chart-grid))' } : undefined}
          >
            <div className="flex items-baseline justify-between gap-3">
              <a
                href={LIBRARY_PATH}
                onClick={onOpen}
                className="text-sm font-semibold text-foreground/85 hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
                aria-label={t('testResults.thinkingPatternsOpenLibrary', { name: row.label })}
              >
                {row.label}
              </a>
              <span className={cn('shrink-0 text-xs font-extrabold tabular-nums', deltaClass)}>
                {deltaLabel}
              </span>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
              {hasDelta && (
                <span
                  className="absolute inset-y-0 left-1/2 w-px"
                  style={{ backgroundColor: 'hsl(var(--chart-tick))', opacity: 0.5 }}
                  aria-hidden="true"
                />
              )}
              {(!hasDelta || isGood || isBad) && (
                <div
                  className={cn(
                    'absolute top-0 h-full rounded-full transition-[width] duration-300',
                    !hasDelta && 'bg-primary',
                    isGood && 'bg-success',
                    isBad && 'bg-destructive',
                  )}
                  style={
                    hasDelta
                      ? isGood
                        ? { right: '50%', width: `${fillWidth}%` }
                        : { left: '50%', width: `${fillWidth}%` }
                      : { left: 0, width: `${fillWidth}%` }
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
