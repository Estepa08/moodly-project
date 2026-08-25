import { useTranslation } from 'react-i18next';
import { Heart, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import Eyebrow from '../components/ui/eyebrow';
import { Period } from '../lib/constants';
import { PERIODS } from '../lib/utils';

interface WellbeingCardProps {
  average: number | null;
  isLoading: boolean;
  expanded: boolean;
  onToggle: () => void;
  panelId: string;
  /** Период, за который считается среднее — подпись над числом (регистр
      "недельного обзора", в отличие от функционального повседневного ввода). */
  period?: Period;
}

export default function WellbeingCard({
  average,
  isLoading,
  expanded,
  onToggle,
  panelId,
  period,
}: WellbeingCardProps) {
  const { t } = useTranslation();
  const periodLabelKey = period ? PERIODS.find((p) => p.key === period)?.labelKey : undefined;

  const colorClass =
    average !== null
      ? average >= 7
        ? 'text-primary'
        : average >= 4
          ? 'text-primary-muted'
          : 'text-primary-dim'
      : 'text-muted-foreground';

  return (
    <Card className="shadow-neumorphic">
      <CardContent className="py-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex items-center justify-between w-full gap-3 py-4 text-left cursor-pointer rounded-xl transition-[box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Heart
              aria-hidden="true"
              className="w-6 h-6 text-primary shrink-0 animate-heart-beat"
            />
            <span className="text-base font-medium text-foreground">
              {t('dashboard.wellbeing')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLoading ? (
              <span className="text-sm text-muted-foreground">
                {t('dashboard.practicesLoading')}
              </span>
            ) : (
              <div className="flex flex-col items-end">
                {periodLabelKey && average !== null && <Eyebrow>{t(periodLabelKey)}</Eyebrow>}
                <span className={`text-5xl font-bold font-serif leading-none ${colorClass}`}>
                  {average !== null ? average.toFixed(1) : '—'}
                </span>
              </div>
            )}
            <ChevronDown
              aria-hidden="true"
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
