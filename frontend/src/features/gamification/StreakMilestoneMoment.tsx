import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Sparkles, Flame, Share2 } from 'lucide-react';
import { ModalShell } from '../../components/ui/modal-shell';
import { Button } from '../../components/ui/button';
import PetAvatar from './PetAvatar';
import { usePets } from './useCreature';
import { PET_DEFINITIONS } from './pets';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useConfettiBurst } from '../../hooks/useConfettiBurst';
import type { StreakMilestoneDays } from '../../hooks/useStreakMilestoneMoment';
import { cn } from '../../lib/utils';

interface StreakMilestoneMomentProps {
  open: boolean;
  days: StreakMilestoneDays | null;
  onDismiss: () => void;
}

// Позиции декоративных sparkle-иконок — тот же приём, что в EvolutionMoment.tsx,
// но количество растёт по вехе (см. docs/gamification-phase2-visuals.svg, ряд 2).
const SPARKLE_POSITIONS = [
  { top: '6%', left: '14%', delay: '0ms' },
  { top: '10%', left: '82%', delay: '80ms' },
  { top: '18%', left: '48%', delay: '150ms' },
  { top: '4%', left: '62%', delay: '220ms' },
  { top: '22%', left: '24%', delay: '60ms' },
  { top: '14%', left: '90%', delay: '110ms' },
];

// Tier 3: каждая веха насыщеннее предыдущей — sparkle-иконки растут по
// количеству, canvas-confetti подключается только с 30 дней, на 100 —
// удваивается (боковые залпы), кольцо-glow тоже эскалирует по цвету.
const TIER_CONFIG: Record<
  StreakMilestoneDays,
  {
    accentClass: string;
    ringClass: string | null;
    sparkleCount: number;
    confetti: { particleCount: number; colors: string[] } | null;
    sideBursts: boolean;
  }
> = {
  7: {
    accentClass: 'text-primary',
    ringClass: null,
    sparkleCount: 3,
    confetti: null,
    sideBursts: false,
  },
  30: {
    accentClass: 'text-accent',
    ringClass: 'bg-accent/20',
    sparkleCount: 5,
    confetti: { particleCount: 60, colors: ['#7B5BF2', '#D63A85', '#F5A623'] },
    sideBursts: false,
  },
  100: {
    accentClass: 'text-warning',
    ringClass: 'bg-warning/25',
    sparkleCount: 6,
    confetti: { particleCount: 120, colors: ['#F5A623', '#FFD166', '#D63A85', '#7B5BF2'] },
    sideBursts: true,
  },
};

// F1-стиль (см. EvolutionMoment.tsx): полноэкранный оверлей на вехи стрика
// 7/30/100 дней (см. useStreakMilestoneMoment). Показывается один раз за
// веху — растущая интенсивность, не новый визуальный язык.
export default function StreakMilestoneMoment({
  open,
  days,
  onDismiss,
}: StreakMilestoneMomentProps) {
  const { t } = useTranslation();
  const isReducedMotion = useReducedMotion();
  const { data: pets } = usePets();
  const burstConfetti = useConfettiBurst();

  const petType = pets?.activePetType ?? 'puff';
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? 'pets.puff');

  const config = days ? TIER_CONFIG[days] : null;
  // Phase 3, п.6 (см. docs/gamification-phase3-visuals.svg): шеринг только на
  // «весомых» вехах (30/100), не на 7 — не каждая веха достойна поделиться.
  // Только текст (Web Share API), без картинки — динамическая OG-генерация
  // отложена в Phase 4 (нет SSR/рендера изображений в бэкенде).
  const canShare = days === 30 || days === 100;

  const handleShare = async () => {
    if (!days) return;
    const shareText = t('streakMilestone.shareText', { count: days });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // Пользователь отменил шеринг или платформа отказала — не критично.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(t('streakMilestone.shareCopied'));
    } catch {
      // Буфер обмена недоступен — кнопка не критична для основного флоу.
    }
  };

  useEffect(() => {
    if (!open || !config?.confetti || isReducedMotion) return;
    burstConfetti({ particleCount: config.confetti.particleCount, colors: config.confetti.colors });
    if (config.sideBursts) {
      const t1 = setTimeout(
        () =>
          burstConfetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: config.confetti!.colors,
          }),
        200,
      );
      const t2 = setTimeout(
        () =>
          burstConfetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: config.confetti!.colors,
          }),
        200,
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, days, isReducedMotion]);

  if (!days || !config) return null;

  return (
    <ModalShell
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      title={t('streakMilestone.title', { count: days })}
      description={t(`streakMilestone.body.${days}`)}
      className="max-w-sm overflow-hidden"
    >
      <div className="relative py-2 flex flex-col items-center gap-3">
        {!isReducedMotion &&
          SPARKLE_POSITIONS.slice(0, config.sparkleCount).map((p, i) => (
            <Sparkles
              key={i}
              aria-hidden="true"
              className={cn('absolute w-4 h-4 animate-evolution-confetti', config.accentClass)}
              style={{ top: p.top, left: p.left, animationDelay: p.delay }}
            />
          ))}

        <span className="relative">
          {!isReducedMotion && config.ringClass && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute -inset-3 rounded-full blur-md animate-glow-warm',
                config.ringClass,
              )}
            />
          )}
          <PetAvatar petType={petType} size="lg" plain ariaLabel={petName} />
        </span>

        <p className={cn('flex items-center gap-1.5 text-2xl font-extrabold', config.accentClass)}>
          <Flame aria-hidden="true" className="w-6 h-6" />
          {t('streakMilestone.streakCount', { count: days })}
        </p>
      </div>

      <Button variant="default" className="w-full mt-2" onClick={onDismiss}>
        {t(`streakMilestone.cta.${days}`)}
      </Button>
      {canShare && (
        <Button variant="outline" className="w-full mt-2" onClick={handleShare}>
          <Share2 aria-hidden="true" className="w-4 h-4" />
          {t('streakMilestone.share')}
        </Button>
      )}
    </ModalShell>
  );
}
