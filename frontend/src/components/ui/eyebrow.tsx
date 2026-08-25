import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

// Служебный, "редакторский" регистр — только для мета-данных (даты, счётчики,
// подписи периода), не для основного текста. См. font.mono в tailwind.config.js.
export default function Eyebrow({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
