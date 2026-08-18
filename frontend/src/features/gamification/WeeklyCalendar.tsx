import { useTranslation } from 'react-i18next';
import { Check, Gift } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useWeekly, useClaimWeekly } from './useCreature';
import { LoadingCard } from '../../components/ui/loading-card';

const DAY_LABEL_KEYS = [
  'weekday.mon',
  'weekday.tue',
  'weekday.wed',
  'weekday.thu',
  'weekday.fri',
  'weekday.sat',
  'weekday.sun',
];

// C2: неделя Пн–Вс, цель — любые N дней с практикой/чек-ином. Пропущенный
// день остаётся нейтральным (не красным), счётчик накопительный — без
// штрафов и таймеров.
export default function WeeklyCalendar() {
  const { t } = useTranslation();
  const { data: weekly, isLoading } = useWeekly();
  const claimWeekly = useClaimWeekly();

  if (isLoading) return <LoadingCard />;
  if (!weekly) return null;

  const remaining = Math.max(0, weekly.goal - weekly.completedCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {t('weekly.progressLabel')}
        </span>
        <span className="text-xs font-bold text-primary tabular-nums">
          {t('weekly.progressValue', { current: weekly.completedCount, goal: weekly.goal })}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekly.days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-full aspect-square rounded-full flex items-center justify-center border-2',
                day.completed
                  ? 'bg-success/10 border-success/30 text-success'
                  : day.isToday
                    ? 'bg-muted border-primary text-primary'
                    : 'bg-muted border-transparent text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {day.completed ? (
                <Check className="w-4 h-4" strokeWidth={3} />
              ) : (
                <span className="text-[10px] font-bold" />
              )}
            </div>
            <span
              className={cn(
                'text-[10px] font-semibold',
                day.isToday ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {t(DAY_LABEL_KEYS[day.dayOfWeek])}
            </span>
          </div>
        ))}
      </div>

      {weekly.claimed ? (
        <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5">
          <Check aria-hidden="true" className="w-4 h-4 text-success shrink-0" strokeWidth={3} />
          <p className="text-xs font-semibold text-success">
            {t('weekly.claimedHint', { xp: weekly.xpReward })}
          </p>
        </div>
      ) : weekly.goalReached ? (
        <button
          type="button"
          onClick={() => claimWeekly.mutate()}
          disabled={claimWeekly.isPending}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-btn-gradient text-primary-foreground px-3 py-2.5 text-sm font-bold shadow-neumorphic-sm transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Gift aria-hidden="true" className="w-4 h-4" />
          {t('weekly.claimCta', { xp: weekly.xpReward })}
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2.5">
          <Gift aria-hidden="true" className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs font-semibold text-warning">
            {t('weekly.goalHint', { remaining, xp: weekly.xpReward })}
          </p>
        </div>
      )}
    </div>
  );
}
