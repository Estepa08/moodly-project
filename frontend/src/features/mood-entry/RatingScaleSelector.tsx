import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import type { RatingLevel } from '../../lib/ratingLevels';

interface RatingScaleSelectorProps {
  levels: RatingLevel[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  disabled?: boolean;
  compact?: boolean;
}

function vibrate() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      /* vibration may be unavailable */
    }
  }
}

export function RatingScaleSelector({
  levels,
  value,
  onChange,
  ariaLabel,
  disabled,
  compact,
}: RatingScaleSelectorProps) {
  const { t } = useTranslation();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = (level: RatingLevel) => {
    onChange(level.value);
    vibrate();
  };

  const handleKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = Math.min(levels.length - 1, Math.max(0, index + delta));
    handleSelect(levels[next]);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full items-stretch justify-center gap-1.5 sm:gap-2.5"
    >
      {levels.map((level, index) => {
        const isActive = level.value === value;
        const Icon = level.Icon;
        const label = t(level.labelKey);
        return (
          <button
            key={level.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            disabled={disabled}
            onClick={() => handleSelect(level)}
            onKeyDown={handleKeyDown(index)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-[color,background-color,box-shadow,transform] duration-150 cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              compact ? 'h-12 px-0.5' : 'h-14 px-1',
              isActive
                ? 'bg-primary/10 text-primary shadow-neumorphic-sm scale-105 ring-2 ring-primary'
                : 'bg-muted text-muted-foreground hover:text-primary hover:bg-primary/5 hover:shadow-neumorphic-sm active:scale-[0.97]',
            )}
          >
            <span className="relative flex items-center justify-center">
              <Icon aria-hidden="true" className={compact ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} />
            </span>
            <span
              className={cn(
                'leading-tight text-center truncate max-w-full',
                compact ? 'text-[10px]' : 'text-[10px] sm:text-[11px]',
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
