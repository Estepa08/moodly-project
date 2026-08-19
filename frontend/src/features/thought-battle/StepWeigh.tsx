import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale } from 'lucide-react';
import { Slider } from '../../components/ui/slider';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

interface StepWeighProps {
  gives: string[];
  costs: string[];
  onComplete: () => void;
}

export default function StepWeigh({ gives, costs, onComplete }: StepWeighProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(50);
  const costsHeavier = value > 50;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{t('thoughtBattle.step3Title')}</h3>
        <p className="text-xs text-muted-foreground">{t('thoughtBattle.step3Hint')}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl p-3 bg-card shadow-neumorphic-sm space-y-1.5">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
            {t('thoughtBattle.step3Gives')}
          </p>
          <ul className="space-y-1">
            {gives.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl p-3 bg-card shadow-neumorphic-sm space-y-1.5">
          <p className="text-[11px] font-bold text-accent uppercase tracking-wider">
            {t('thoughtBattle.step3Costs')}
          </p>
          <ul className="space-y-1">
            {costs.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl p-4 bg-card shadow-neumorphic-sm space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Scale
            aria-hidden="true"
            className={cn(
              'w-5 h-5 transition-[color,transform] duration-200',
              costsHeavier ? 'text-accent rotate-6' : 'text-primary -rotate-6',
            )}
          />
          <span className={cn('text-xs font-bold', costsHeavier ? 'text-accent' : 'text-primary')}>
            {costsHeavier ? t('thoughtBattle.step3CostsSide') : t('thoughtBattle.step3GivesSide')}
          </span>
        </div>
        <Slider
          aria-label={t('thoughtBattle.step3Hint')}
          min={0}
          max={100}
          step={1}
          value={[value]}
          onValueChange={([v]) => setValue(v)}
          style={{ '--slider-fill': 'hsl(var(--accent))' } as React.CSSProperties}
        />
      </div>

      <Button variant="default" className="w-full" onClick={onComplete}>
        {t('thoughtBattle.step3Cta')}
      </Button>
    </div>
  );
}
