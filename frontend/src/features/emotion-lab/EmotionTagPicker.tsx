import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { EMOTIONS } from '@moodly/shared';
import { cn } from '../../lib/utils';
import ChipMultiSelect from '../shared/ChipMultiSelect';
import { emotionMeta, dyadByKey } from './emotionLab';
import { emotionDefinition } from './emotionLibrary';
import { useEmotionLabState } from './useEmotionLab';

interface EmotionTagPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  className?: string;
}

interface ChipData {
  key: string;
  labelKey: string;
}

export default function EmotionTagPicker({
  value,
  onChange,
  max = 3,
  className,
}: EmotionTagPickerProps) {
  const { t } = useTranslation();
  const { data: labState } = useEmotionLabState();
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const baseChips: ChipData[] = EMOTIONS.map((e) => ({
    key: e.key,
    labelKey: `emotionLab.emotions.${e.key}`,
  }));
  const discoveredDyadChips: ChipData[] = (labState?.discoveredDyads ?? [])
    .map((key) => dyadByKey(key))
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map((d) => ({ key: d.key, labelKey: `emotionLab.dyads.${d.key}` }));

  const chips = [...baseChips, ...discoveredDyadChips];

  const toggle = (key: string) => {
    setPreviewKey(key);
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, key]);
  };

  const previewText = previewKey ? emotionDefinition(previewKey) : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <ChipMultiSelect
        className="justify-center"
        options={chips}
        selected={value}
        renderChip={(chip, selected) => {
          const meta = emotionMeta(chip.key);
          const Icon = meta.icon;
          const disabled = !selected && value.length >= max;
          return (
            <button
              type="button"
              onClick={() => toggle(chip.key)}
              disabled={disabled}
              aria-pressed={selected}
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 rounded-full border text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                selected
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-foreground hover:border-primary/50',
              )}
            >
              <Icon aria-hidden="true" className="w-3.5 h-3.5" style={{ color: meta.color }} />
              {t(chip.labelKey)}
            </button>
          );
        }}
      />

      {previewText && (
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug px-1">
          <Info aria-hidden="true" className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {previewText}
        </p>
      )}
    </div>
  );
}
