import { useTranslation } from 'react-i18next';
import { Flame, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StreakIndicatorProps {
  streak: number;
  /** Токены заморозки стрика — пропуск одного дня их не сбрасывает.
      Чип рендерится только при freezeCount > 0 (0 = не показываем вовсе). */
  freezeCount?: number;
  className?: string;
}

export default function StreakIndicator({
  streak,
  freezeCount = 0,
  className,
}: StreakIndicatorProps) {
  const { t } = useTranslation();

  if (streak <= 0) return null;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className={cn(
          'flex items-center gap-1 px-2.5 py-1 rounded-full bg-card shadow-elevation-inset text-xs font-medium transition-[color] duration-150',
          streak >= 7 ? 'text-accent' : 'text-muted-foreground',
        )}
        title={t('dailyCheckIn.streak', { count: streak })}
      >
        <Flame aria-hidden="true" className={cn('w-3.5 h-3.5', streak >= 7 && 'text-accent')} />
        <span>{streak}</span>
      </div>
      {freezeCount > 0 && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-info/10 text-xs font-semibold text-info"
          title={t('dailyCheckIn.streakFreezeCount', { count: freezeCount })}
        >
          <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{freezeCount}</span>
        </div>
      )}
    </div>
  );
}
