import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, RotateCw } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { subscribeSpeech, type PetSpeech } from "./celebration";
import { cn } from "../../lib/utils";

export interface SpeechState {
  current: PetSpeech | null;
  dismiss: () => void;
  replay: () => void;
}

const DEFAULT_AUTO_HIDE_MS = 6000;

interface PetSpeechBubbleProps extends SpeechState {
  autoHideMs?: number;
  className?: string;
}

export default function PetSpeechBubble({
  current,
  dismiss,
  replay,
  autoHideMs = DEFAULT_AUTO_HIDE_MS,
  className,
}: PetSpeechBubbleProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, autoHideMs);
    return () => clearTimeout(timer);
  }, [current, autoHideMs, dismiss]);

  if (!current) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative rounded-2xl bg-card shadow-neumorphic-sm px-4 py-3 pr-9",
        reducedMotion ? "" : "animate-bubble-in",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-8 w-3.5 h-3.5 bg-card rotate-45"
      />
      <p className="text-sm font-semibold text-foreground leading-snug pr-6">{current.text}</p>

      <div className="absolute right-2 top-2 flex items-center gap-1">
        <button
          type="button"
          onClick={replay}
          aria-label={t("petSpeech.replay")}
          title={t("petSpeech.replay")}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("petSpeech.close")}
          title={t("petSpeech.close")}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function usePetSpeech(): SpeechState {
  const [queue, setQueue] = useState<PetSpeech[]>([]);
  const [current, setCurrent] = useState<PetSpeech | null>(null);

  useEffect(() => {
    return subscribeSpeech((speech) => {
      setQueue((prev) => [...prev, speech]);
    });
  }, []);

  useEffect(() => {
    if (current !== null || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue((prev) => prev.slice(1));
  }, [current, queue]);

  const dismiss = useCallback(() => setCurrent(null), []);

  const replay = useCallback(() => {
    setCurrent((prev) => (prev ? { ...prev, id: `${prev.id}-replay-${Date.now()}` } : prev));
  }, []);

  return { current, dismiss, replay };
}
