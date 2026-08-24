import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Trophy, Medal } from 'lucide-react';
import { ModalShell } from '../../components/ui/modal-shell';
import { Button } from '../../components/ui/button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useConfettiBurst } from '../../hooks/useConfettiBurst';
import { TITLE_MAP, TITLE_EMOJI } from './TitleSelector';
import type { Achievement } from '../../lib/api';
import { cn } from '../../lib/utils';

interface HiddenAchievementMomentProps {
  open: boolean;
  achievement: Achievement | null;
  onDismiss: () => void;
}

// Средняя плотность sparkle — тот же вес, что 30-дневная веха стрика
// (см. docs/gamification-hidden-achievement-visuals.svg): разблокировка
// скрытой ачивки — приятный сюрприз, но не такое редкое событие, как 100-дневная веха.
const SPARKLE_POSITIONS = [
  { top: '8%', left: '18%', delay: '0ms' },
  { top: '12%', left: '78%', delay: '80ms' },
  { top: '4%', left: '48%', delay: '150ms' },
  { top: '18%', left: '30%', delay: '60ms' },
  { top: '20%', left: '68%', delay: '110ms' },
];

// F1-стиль (см. EvolutionMoment.tsx, StreakMilestoneMoment.tsx): полноэкранный
// оверлей на разблокировку скрытой ачивки — тот же паттерн, третий по счёту
// повод для Tier 3. Крупные левел-апы (5/10/20) отдельного компонента не
// требуют — они уже совпадают с порогами EVOLUTION_STAGES и покрыты
// существующим EvolutionMoment.
export default function HiddenAchievementMoment({
  open,
  achievement,
  onDismiss,
}: HiddenAchievementMomentProps) {
  const { t } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const burstConfetti = useConfettiBurst();

  useEffect(() => {
    if (!open || !achievement || isReducedMotion) return;
    burstConfetti({ particleCount: 70, colors: ['#F5A623', '#7B5BF2', '#D63A85'] });
  }, [open, achievement, isReducedMotion, burstConfetti]);

  if (!achievement) return null;

  const titleLabel = achievement.titleReward
    ? t(TITLE_MAP[achievement.titleReward] ?? achievement.titleReward)
    : null;
  const titleEmoji = achievement.titleReward
    ? (TITLE_EMOJI[achievement.titleReward] ?? '🎖️')
    : null;

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      title={t('hiddenAchievement.title')}
      description={t(achievement.titleKey)}
      className="max-w-sm overflow-hidden"
    >
      <div className="relative py-2 flex flex-col items-center gap-3">
        {!isReducedMotion &&
          SPARKLE_POSITIONS.map((p, i) => (
            <Sparkles
              key={i}
              aria-hidden="true"
              className={cn('absolute w-4 h-4 animate-evolution-confetti text-warning')}
              style={{ top: p.top, left: p.left, animationDelay: p.delay }}
            />
          ))}

        <span className="relative flex items-center justify-center">
          {!isReducedMotion && (
            <span
              aria-hidden="true"
              className="absolute -inset-3 rounded-full blur-md bg-warning/25 animate-glow-warm"
            />
          )}
          <span className="relative w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center">
            <Trophy aria-hidden="true" className="w-9 h-9 text-warning" />
          </span>
        </span>

        <div className="text-center">
          <p className="text-lg font-extrabold text-foreground">{t(achievement.titleKey)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t(achievement.descKey)}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {achievement.xpReward > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              +{achievement.xpReward} XP
            </span>
          )}
          {titleLabel && titleEmoji && (
            <span className="flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning">
              <Medal aria-hidden="true" className="w-3.5 h-3.5" />
              {titleEmoji} {titleLabel}
            </span>
          )}
        </div>
      </div>

      <Button variant="default" className="w-full mt-2" onClick={onDismiss}>
        {t('hiddenAchievement.cta')}
      </Button>
    </ModalShell>
  );
}
