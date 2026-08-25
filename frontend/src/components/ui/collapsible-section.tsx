import { useState, useCallback, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { safeSessionStorage } from '../../lib/safeStorage';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  /** Цвет акцентной рейки слева от контента (в тон иконки секции) */
  railClassName?: string;
  defaultOpen?: boolean;
  storageKey?: string;
  children: ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  railClassName = 'bg-primary/80',
  defaultOpen = false,
  storageKey,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      const stored = safeSessionStorage.getItem(storageKey);
      if (stored !== null) return stored === '1';
    }
    return defaultOpen;
  });

  const id = `collapsible-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        safeSessionStorage.setItem(storageKey, next ? '1' : '0');
      }
      return next;
    });
  }, [storageKey]);

  return (
    <div className={cn('space-y-0', className)}>
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="group flex items-center gap-3 w-full p-3 rounded-xl bg-card shadow-neumorphic-sm transition-[box-shadow,transform] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
      >
        {Icon && (
          <span
            className={cn(
              'w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-accent/10 text-accent transition-colors duration-200',
              iconClassName,
            )}
          >
            <Icon aria-hidden="true" className="w-4 h-4" />
          </span>
        )}
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-sm font-semibold text-foreground font-serif leading-tight">
            {title}
          </span>
          {subtitle && (
            <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">
              {subtitle}
            </span>
          )}
        </span>
        <span
          className={cn(
            'w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-muted/60 text-muted-foreground transition-[background-color,transform] duration-200',
            open && 'bg-accent/10 text-accent',
          )}
        >
          <ChevronDown
            aria-hidden="true"
            className={cn('w-4 h-4 transition-transform duration-200', open && 'rotate-180')}
          />
        </span>
      </button>
      {/*
        Collapse via an animated grid track (0fr <-> 1fr) rather than an
        animated max-height. Animating max-height on an ancestor of the
        overflow-y-auto list below is a known source of "list looks scrollable
        but touch-scroll does nothing" bugs on mobile WebKit right after the
        section opens — the grid-track approach doesn't force an explicit
        height value on the way to/from 0, so the inner scroll box's layout
        never gets caught mid-transition.
      */}
      <div
        id={id}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-0.5 pt-2">
            <div className="relative rounded-xl bg-muted/70 shadow-neumorphic-inset pr-0.5 max-h-[56vh] overflow-y-auto">
              <div className="flex gap-2.5 p-2 pl-2.5">
                <span
                  aria-hidden="true"
                  className={cn('w-1 rounded-full shrink-0', railClassName)}
                />
                <div className="flex-1 min-w-0">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
