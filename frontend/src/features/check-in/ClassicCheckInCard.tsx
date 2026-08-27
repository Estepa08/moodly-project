import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClassicCheckInCardProps {
  onCheckIn: () => void;
}

// Лёгкий вход в тот же чек-ин-модал (PetCheckInDialog), что и в режиме
// с компаньоном — но без питомца/энергии/уровня на карточке. Классический
// режим (см. docs/plans/three-personas-design-gaps.md, Сессия 1) убирает
// игровую надстройку из UI, не саму механику чек-ина.
export default function ClassicCheckInCard({ onCheckIn }: ClassicCheckInCardProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t('myDay.classicCheckInTitle')}
      className="rounded-3xl bg-card shadow-neumorphic p-5 space-y-3"
    >
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
          <CheckCircle2 aria-hidden="true" className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="font-serif font-bold text-foreground text-base leading-tight">
            {t('myDay.classicCheckInTitle')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('myDay.classicCheckInDesc')}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCheckIn}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5',
          'text-sm font-bold text-primary-foreground shadow-neumorphic-sm',
          'transition-[transform,filter] duration-150 hover:brightness-105 active:scale-[0.98]',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {t('myDay.classicCheckInCta')}
        <ArrowRight aria-hidden="true" className="w-4 h-4" />
      </button>
    </section>
  );
}
