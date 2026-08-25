import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

// Редакционная цитата для инсайтов/наблюдений — тонкое правило + курсивный
// serif вместо обычной карточки-текста. Использовать точечно (1 на экран),
// не как замену обычному тексту подсказок.
export default function PullQuote({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'border-t border-border/70 pt-2.5 font-serif text-sm italic leading-snug text-foreground/80',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
