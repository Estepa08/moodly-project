import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { emotionMeta } from './emotionLab';
import type { EmotionLabAttemptResponse } from './useEmotionLab';

interface EmotionResultProps {
  result: EmotionLabAttemptResponse;
}

export default function EmotionResult({ result }: EmotionResultProps) {
  const { t } = useTranslation();
  const [a, b] = result.dyad.emotions;
  const metaA = emotionMeta(a);
  const metaB = emotionMeta(b);
  const IconA = metaA.icon;
  const IconB = metaB.icon;

  return (
    <div className="rounded-xl bg-card-gradient text-card-foreground shadow-clay border border-border overflow-hidden">
      <div className="px-5 pt-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-[10px] font-bold uppercase tracking-wide">
          <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />
          {result.isNewDiscovery ? t('emotionLab.newDiscovery') : t('emotionLab.alreadyKnown')}
        </span>
      </div>

      <div className="px-5 pb-5 flex items-center gap-4">
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: metaA.tint }}
          >
            <IconA
              aria-hidden="true"
              className="w-6 h-6"
              style={{ color: metaA.color }}
              strokeWidth={2}
            />
          </span>
          <span className="text-lg text-muted-foreground">+</span>
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: metaB.tint }}
          >
            <IconB
              aria-hidden="true"
              className="w-6 h-6"
              style={{ color: metaB.color }}
              strokeWidth={2}
            />
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="font-heading font-extrabold text-2xl text-foreground leading-tight">
            {t(`emotionLab.dyads.${result.dyad.key}`)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(`emotionLab.emotions.${a}`)} + {t(`emotionLab.emotions.${b}`)}
          </p>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
            {t(`emotionLab.levelLabel.${result.dyad.level}`)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs border-t',
          result.isNewDiscovery
            ? 'bg-success/10 border-success/20 text-success'
            : 'bg-muted/50 border-border text-muted-foreground',
        )}
      >
        <span className="font-medium">
          {result.isNewDiscovery
            ? t('emotionLab.attemptCountedDiscovery')
            : t('emotionLab.attemptCountedRepeat')}
        </span>
        <span>{t('emotionLab.attemptsLeft', { count: result.attemptsRemaining })}</span>
      </div>
    </div>
  );
}
