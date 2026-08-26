import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Slider } from '../../components/ui/slider';
import { IconButton } from '../../components/ui/icon-button';

interface FactorSliderRowProps {
  label: string;
  percent: number;
  onChange: (percent: number) => void;
  onRemove?: () => void;
}

export default function FactorSliderRow({
  label,
  percent,
  onChange,
  onRemove,
}: FactorSliderRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">{label}</span>
          <span className="tabular-nums text-muted-foreground">{percent}%</span>
        </div>
        <Slider
          aria-label={label}
          min={0}
          max={100}
          step={1}
          value={[percent]}
          onValueChange={([v]) => onChange(v)}
        />
      </div>
      {onRemove && (
        <IconButton
          variant="ghost"
          size="icon-sm"
          label={t('responsibilityPie.removeFactor')}
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <X aria-hidden="true" className="w-3.5 h-3.5" />
        </IconButton>
      )}
    </div>
  );
}
