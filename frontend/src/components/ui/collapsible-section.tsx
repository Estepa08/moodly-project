import { useState, useCallback, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  storageKey?: string;
  children: ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  icon: Icon,
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
      }
    }
    return defaultOpen;
  });

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
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
        className="flex items-center gap-2 w-full py-2 rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
      >
        {Icon && <Icon aria-hidden="true" className="w-4 h-4 text-muted-foreground shrink-0" />}
        <span className="text-sm font-semibold text-foreground font-serif flex-1 text-left">
          {title}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="pt-1">{children}</div>
      </div>
    </div>
  );
}
