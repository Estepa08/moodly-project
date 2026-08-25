import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { DISTORTION_KEYS, DistortionKey } from '../../lib/distortionsQuiz';
import { suggestDistortion } from '../../lib/distortionKeywordHints';
import { cn } from '../../lib/utils';
import ChipMultiSelect from '../shared/ChipMultiSelect';

interface DistortionTagsSelectorProps {
  value: DistortionKey[];
  onChange: (next: DistortionKey[]) => void;
  /** Текст заметки — для автоподсказки «✨». */
  noteText: string;
}

const VISIBLE_COUNT = 5;
const POPULAR_KEYS: DistortionKey[] = [
  DistortionKey.AllOrNothing,
  DistortionKey.Magnification,
  DistortionKey.JumpingToConclusions,
  DistortionKey.ShouldStatements,
  DistortionKey.Overgeneralization,
];

export default function DistortionTagsSelector({
  value,
  onChange,
  noteText,
}: DistortionTagsSelectorProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const suggested = useMemo(() => suggestDistortion(noteText), [noteText]);

  const ordered = useMemo(() => {
    const popular = new Set(POPULAR_KEYS);
    return [...DISTORTION_KEYS].sort((a, b) => {
      const pa = popular.has(a as DistortionKey) ? 0 : 1;
      const pb = popular.has(b as DistortionKey) ? 0 : 1;
      return pa - pb;
    });
  }, []);

  const isSelected = (key: DistortionKey) => value.includes(key);
  const isSuggested = (key: DistortionKey) => suggested === key && !isSelected(key);

  const handleToggle = (key: DistortionKey) => {
    onChange(isSelected(key) ? value.filter((k) => k !== key) : [...value, key]);
  };

  const visible = expanded ? ordered : ordered.slice(0, VISIBLE_COUNT);
  const hasMore = ordered.length > VISIBLE_COUNT;
  const visibleOptions = useMemo(() => visible.map((key) => ({ key })), [visible]);

  return (
    <div className="space-y-2">
      <ChipMultiSelect
        options={visibleOptions}
        selected={value}
        renderChip={(option, selected) => (
          <DistortionChip
            label={t(`cognitiveDistortions.${option.key}`)}
            selected={selected}
            suggested={isSuggested(option.key)}
            onClick={() => handleToggle(option.key)}
          />
        )}
        trailing={
          hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(expanded ? 'cognitiveDistortions.less' : 'cognitiveDistortions.more')}
              {expanded ? (
                <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
              )}
            </button>
          )
        }
      />

      {suggested && !isSelected(suggested) && (
        <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <Sparkles aria-hidden="true" className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {t('cognitiveDistortions.suggestHint', {
              name: t(`cognitiveDistortions.${suggested}`),
            })}
          </span>
        </p>
      )}
    </div>
  );
}

interface DistortionChipProps {
  label: string;
  selected: boolean;
  suggested: boolean;
  onClick: () => void;
}

function DistortionChip({ label, selected, suggested, onClick }: DistortionChipProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={
        selected
          ? `${label} — ${t('cognitiveDistortions.remove')}`
          : suggested
            ? `${label} — ${t('cognitiveDistortions.addSuggested')}`
            : `${label} — ${t('cognitiveDistortions.add')}`
      }
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-[color,background-color,border-color,box-shadow] duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'border-primary bg-primary text-primary-foreground shadow-neumorphic-sm',
        suggested && !selected && 'border-amber-300 bg-amber-50 text-amber-800',
        !selected &&
          !suggested &&
          'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      <span>#{label}</span>
      {suggested && !selected && <Sparkles aria-hidden="true" className="w-3 h-3 text-amber-500" />}
    </button>
  );
}
