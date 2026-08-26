import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Info } from 'lucide-react';
import { EMOTIONS } from '@moodly/shared';
import { cn } from '../../lib/utils';
import ChipMultiSelect from '../shared/ChipMultiSelect';
import { emotionMeta, emotionValence, dyadByKey, type EmotionValence } from './emotionLab';
import { emotionDefinition } from './emotionLibrary';
import { useEmotionLabState } from './useEmotionLab';

interface EmotionTagPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Общий mood-score шага (0–10), если он уже выбран — определяет, какие
   * базовые эмоции показать первыми (см. valenceOrder). */
  moodValue?: number | null;
  max?: number;
  className?: string;
}

interface ChipData {
  key: string;
  labelKey: string;
}

// После плохого mood-score вероятнее negative-эмоции, после хорошего —
// positive; при среднем/неизвестном порядок остаётся нейтральным.
function valenceOrder(moodValue: number | null | undefined): EmotionValence[] {
  if (moodValue != null && moodValue <= 2.5) return ['negative', 'neutral', 'positive'];
  if (moodValue != null && moodValue >= 7.5) return ['positive', 'neutral', 'negative'];
  return ['neutral', 'positive', 'negative'];
}

export default function EmotionTagPicker({
  value,
  onChange,
  moodValue,
  max = 3,
  className,
}: EmotionTagPickerProps) {
  const { t } = useTranslation();
  const { data: labState } = useEmotionLabState();
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [dyadsExpanded, setDyadsExpanded] = useState(false);

  const priority = valenceOrder(moodValue);
  const baseChips: ChipData[] = useMemo(
    () =>
      [...EMOTIONS]
        .map((e) => ({ key: e.key, labelKey: `emotionLab.emotions.${e.key}` }))
        .sort(
          (a, b) =>
            priority.indexOf(emotionValence(a.key)) - priority.indexOf(emotionValence(b.key)),
        ),
    // priority is derived from moodValue each render; re-sort whenever it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moodValue],
  );
  const discoveredDyadChips: ChipData[] = (labState?.discoveredDyads ?? [])
    .map((key) => dyadByKey(key))
    .filter((d): d is NonNullable<typeof d> => !!d)
    .map((d) => ({ key: d.key, labelKey: `emotionLab.dyads.${d.key}` }));

  // Открытые "диады" могут разрастись до 24 штук — показываем их только по
  // запросу, чтобы список не перегружал экран (особенно на мобильном, где
  // диалог не скроллится сам).
  const chips = dyadsExpanded ? [...baseChips, ...discoveredDyadChips] : baseChips;

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
        trailing={
          discoveredDyadChips.length > 0 && (
            <button
              type="button"
              onClick={() => setDyadsExpanded((v) => !v)}
              aria-expanded={dyadsExpanded}
              className="flex items-center gap-1 h-9 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'w-3.5 h-3.5 transition-transform duration-150',
                  dyadsExpanded && 'rotate-180',
                )}
              />
              {dyadsExpanded
                ? t('emotionLab.hideShades')
                : t('emotionLab.moreShades', { count: discoveredDyadChips.length })}
            </button>
          )
        }
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
