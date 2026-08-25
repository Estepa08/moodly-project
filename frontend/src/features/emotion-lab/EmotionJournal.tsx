import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { DYADS_BY_LEVEL, DYAD_COUNT_BY_LEVEL_VIEW, emotionMeta, type DyadView } from './emotionLab';
import { emotionDefinition } from './emotionLibrary';
import type { EmotionLabState } from './useEmotionLab';

const LEVEL_LABEL_KEYS = {
  1: 'emotionLab.level1',
  2: 'emotionLab.level2',
  3: 'emotionLab.level3',
  4: 'emotionLab.level4',
} as const;

const LEVEL_ICONS = {
  1: '🌟',
  2: '⭐',
  3: '✨',
  4: '👑',
} as const;

interface EmotionJournalProps {
  state: EmotionLabState;
}

export default function EmotionJournal({ state }: EmotionJournalProps) {
  const { t } = useTranslation();
  // Все уровни скрыты по умолчанию, кроме первого
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true, // Только первый уровень открыт
    2: false,
    3: false,
    4: false,
  });

  const discovered = new Set(state.discoveredDyads);

  const countByLevel = (level: 1 | 2 | 3 | 4) =>
    DYADS_BY_LEVEL[level].filter((d) => discovered.has(d.key)).length;

  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const allDiscovered = state.discoveredCount === state.totalDyads;

  return (
    <div className="space-y-4">
      {/* Заголовок с прогрессом */}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-heading font-extrabold text-foreground">
          {t('emotionLab.journalTitle')}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {state.discoveredCount} / {state.totalDyads}
          </span>
          {allDiscovered && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
              🎉 {t('emotionLab.complete')}
            </span>
          )}
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
          style={{ width: `${(state.discoveredCount / state.totalDyads) * 100}%` }}
        />
      </div>

      {/* Список уровней с выпадашками */}
      <div className="space-y-3">
        {([1, 2, 3, 4] as const).map((level) => {
          const isExpanded = expandedLevels[level];
          const count = countByLevel(level);
          const total = DYAD_COUNT_BY_LEVEL_VIEW[level];
          const isComplete = count === total;
          const hasProgress = count > 0 && count < total;

          return (
            <Card
              key={level}
              className={cn(
                'overflow-hidden transition-all duration-200',
                isComplete && 'border-l-4 border-l-green-500',
                hasProgress && !isComplete && 'border-l-4 border-l-blue-400',
              )}
            >
              {/* Заголовок уровня - кликабельный */}
              <button
                onClick={() => toggleLevel(level)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{LEVEL_ICONS[level]}</span>
                  <span className="text-sm font-medium text-foreground">
                    {t(LEVEL_LABEL_KEYS[level])}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      isComplete
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : hasProgress
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count} / {total}
                  </span>
                  {isComplete && (
                    <span className="text-xs text-green-600 dark:text-green-400">✅</span>
                  )}
                  {hasProgress && !isComplete && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">⏳</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {isExpanded ? t('emotionLab.hide') : t('emotionLab.show')}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Список диад - показывается если развернуто */}
              {isExpanded && (
                <CardContent className="pt-2 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DYADS_BY_LEVEL[level].map((dyad) => (
                      <DyadChip key={dyad.key} dyad={dyad} discovered={discovered.has(dyad.key)} />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Подсказка */}
      {state.availableLevel < 4 && (
        <div className="rounded-xl bg-warning/10 border border-warning/20 px-4 py-3 text-xs text-warning">
          <p className="font-medium">{t('emotionLab.journalHint')}</p>
          <p className="mt-0.5 text-warning/90">{t('emotionLab.journalHintExamples')}</p>
        </div>
      )}
    </div>
  );
}

function DyadChip({ dyad, discovered }: { dyad: DyadView; discovered: boolean }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [a, b] = dyad.emotions;
  const metaA = emotionMeta(a);
  const metaB = emotionMeta(b);

  const dyadNameKey = `emotionLab.dyads.${dyad.key}`;
  const definition = emotionDefinition(dyad.key);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => discovered && setExpanded((v) => !v)}
        aria-expanded={discovered ? expanded : undefined}
        className={cn(
          'w-full flex items-center gap-2 h-10 px-3 rounded-full border text-xs font-medium transition-all duration-200',
          discovered
            ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 cursor-pointer'
            : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted/80 cursor-default',
        )}
      >
        <span className="flex items-center gap-1 shrink-0">
          <metaA.icon
            aria-hidden="true"
            className="w-3.5 h-3.5"
            style={{ color: metaA.color }}
            strokeWidth={2.5}
          />
          <metaB.icon
            aria-hidden="true"
            className="w-3.5 h-3.5"
            style={{ color: metaB.color }}
            strokeWidth={2.5}
          />
        </span>
        {discovered ? (
          <span className="truncate font-medium">{t(dyadNameKey)}</span>
        ) : (
          <span className="flex items-center gap-1 truncate">
            <Lock aria-hidden="true" className="w-3 h-3 shrink-0" />
            <span className="truncate text-muted-foreground/60">???</span>
          </span>
        )}
      </button>
      {expanded && discovered && definition && (
        <p className="px-3 text-[11px] text-muted-foreground leading-snug">{definition}</p>
      )}
    </div>
  );
}
