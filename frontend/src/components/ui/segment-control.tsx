import * as React from 'react';
import { cn } from '../../lib/utils';

interface SegmentControlProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function SegmentControl({
  children,
  className,
  scrollable = true,
  ...props
}: SegmentControlProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-xl bg-muted p-1 shadow-neumorphic-inset',
        scrollable && 'overflow-x-auto scrollbar-none overscroll-x-contain',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SegmentControlItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function SegmentControlItem({
  active,
  onClick,
  children,
  size = 'md',
  className,
  type = 'button',
  ...props
}: SegmentControlItemProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-lg font-medium transition-[color,background-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'shrink-0 whitespace-nowrap',
        size === 'sm' ? 'px-2 py-1 text-[10px] min-h-[32px]' : 'px-3 min-h-[44px] text-xs',
        active
          ? 'bg-card text-foreground shadow-neumorphic-sm'
          : 'text-muted-foreground hover:text-primary',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
