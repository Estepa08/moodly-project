import { Fragment, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ChipOption {
  key: string;
}

interface ChipMultiSelectProps<T extends ChipOption> {
  /** Chips to render, in display order. */
  options: readonly T[];
  /** Currently selected keys — used only to tell each chip whether it's selected. */
  selected: string[];
  /** Renders one chip's content (icon, label, styling); membership toggling stays with the caller. */
  renderChip: (option: T, isSelected: boolean) => ReactNode;
  /** Extra content appended after the chips, inside the same flex-wrap row (e.g. a "show more" button). */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Shared "toggle membership in a list of options" chip grid — a flex-wrap row
 * of button-chips. Feature-specific chip appearance (icons, suggestion hints,
 * disabled/cap logic) is supplied via `renderChip`; this component only owns
 * the layout and the selected-membership lookup.
 */
export default function ChipMultiSelect<T extends ChipOption>({
  options,
  selected,
  renderChip,
  trailing,
  className,
}: ChipMultiSelectProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((option) => (
        <Fragment key={option.key}>{renderChip(option, selected.includes(option.key))}</Fragment>
      ))}
      {trailing}
    </div>
  );
}
