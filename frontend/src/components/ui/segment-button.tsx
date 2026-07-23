import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function SegmentGroup({ children }: { children: ReactNode }) {
  return <div className="flex rounded-xl bg-muted p-1 shadow-neumorphic-inset">{children}</div>;
}

export function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-card text-foreground shadow-neumorphic-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
