import { Check, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSync } from "../lib/offline/useSync";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { cn } from "../lib/utils";

/** Мини-индикатор статуса синхронизации в шапке (макет docs/sync-status-indicator.svg). */
export function SyncStatusIndicator() {
  const { status, pending, sync } = useSync();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const label = t(`sync.status.${status}`);

  const icon = (() => {
    switch (status) {
      case "syncing":
        return (
          <Loader2
            aria-hidden="true"
            className={cn("h-4 w-4 text-primary", reducedMotion ? "" : "animate-spin")}
          />
        );
      case "offline":
        return <CloudOff aria-hidden="true" className="h-4 w-4 text-muted-foreground" />;
      case "error":
        return <TriangleAlert aria-hidden="true" className="h-4 w-4 text-destructive" />;
      default:
        return <Check aria-hidden="true" className="h-4 w-4 text-success" />;
    }
  })();

  return (
    <button
      type="button"
      onClick={() => void sync()}
      aria-label={label}
      title={label}
      className="relative h-9 w-9 shrink-0 grid place-items-center rounded-full bg-card shadow-neumorphic-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
    >
      {icon}
      {status === "offline" && pending > 0 && (
        <span
          className="absolute -top-1 -right-1 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-warning text-warning-foreground text-[10px] font-bold leading-none"
          aria-label={t("sync.pending", { count: pending })}
        >
          {pending}
        </span>
      )}
    </button>
  );
}