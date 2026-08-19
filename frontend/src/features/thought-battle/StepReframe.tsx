import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../lib/utils';

const CUSTOM = '__custom__';

interface StepReframeProps {
  options: string[];
  onComplete: (chosen: string) => void;
}

export default function StepReframe({ options, onComplete }: StepReframeProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState('');

  const isCustom = selected === CUSTOM;
  const finalValue = isCustom ? custom.trim() : selected;
  const canSubmit = !!finalValue;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{t('thoughtBattle.step4Title')}</h3>
        <p className="text-xs text-muted-foreground">{t('thoughtBattle.step4Hint')}</p>
      </div>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelected(option)}
            className={cn(
              'w-full text-left rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2 transition-[background-color,box-shadow] duration-150',
              'bg-card shadow-neumorphic-sm hover:shadow-elevation-2 active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected === option && 'ring-2 ring-primary bg-primary/5',
            )}
          >
            <span
              className={cn(
                'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                selected === option ? 'border-primary bg-primary' : 'border-muted-foreground/40',
              )}
            >
              {selected === option && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </span>
            {option}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setSelected(CUSTOM)}
          className={cn(
            'w-full text-left rounded-xl px-4 py-3 text-sm font-semibold text-primary transition-[background-color,box-shadow] duration-150',
            'bg-primary/5 shadow-neumorphic-sm hover:shadow-elevation-2 active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isCustom && 'ring-2 ring-primary',
          )}
        >
          {t('thoughtBattle.step4CustomOption')}
        </button>
        {isCustom && (
          <Textarea
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t('thoughtBattle.step4CustomPlaceholder')}
            rows={3}
          />
        )}
      </div>

      <Button
        variant="default"
        className="w-full"
        disabled={!canSubmit}
        onClick={() => finalValue && onComplete(finalValue)}
      >
        {t('thoughtBattle.step4Cta')}
      </Button>
    </div>
  );
}
