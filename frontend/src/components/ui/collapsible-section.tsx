import { useState, useCallback, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

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
  railClassName = "bg-primary/80",
  defaultOpen = true,
  storageKey,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => {
    if (storageKey) {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored !== null) return stored === "1";
      } catch {
        /* sessionStorage may throw in private browsing */
      }
    }
    return defaultOpen;
  });

  const id = `collapsible-${title.replace(/\s+/g, "-").toLowerCase()}`;

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
          /* sessionStorage may throw in private browsing */
        }
      }
      return next;
    });
  }, [storageKey]);

  return (
    <div className={cn("space-y-0", className)}>
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="group flex items-center gap-3 w-full p-3 rounded-xl bg-card shadow-neumorphic-sm transition-[box-shadow,transform] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
      >
        {Icon && (
          <span
            className={cn(
              "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-accent/10 text-accent transition-colors duration-200",
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
            "w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-muted/60 text-muted-foreground transition-[background-color,transform] duration-200",
            open && "bg-accent/10 text-accent",
          )}
        >
          <ChevronDown
            aria-hidden="true"
            className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")}
          />
        </span>
      </button>
      <div
        id={id}
        className={cn(
          "transition-[max-height,opacity] duration-200 overflow-hidden",
          open ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-0.5 pt-2">
          <div className="h-px bg-border mb-3" aria-hidden="true" />
          <div className="relative rounded-xl bg-muted/70 shadow-neumorphic-inset pr-0.5 max-h-[56vh] overflow-y-auto">
            <div className="flex gap-2.5 p-2 pl-2.5">
              <span aria-hidden="true" className={cn("w-1 rounded-full shrink-0", railClassName)} />
              <div className="flex-1 min-w-0">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
