import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function StickyBottomBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-md border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
