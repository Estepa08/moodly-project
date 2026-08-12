import { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Volume2 } from "lucide-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { subscribeSpeech, type PetSpeech } from "./celebration";
import { cn } from "../../lib/utils";

export interface SpeechState {
  current: PetSpeech | null;
  dismiss: () => void;
}

const DEFAULT_AUTO_HIDE_MS = 6000;

export type BubbleAnchor = 
  | "left"   
  | "right";

interface PetSpeechBubbleProps extends SpeechState {
  autoHideMs?: number;
  className?: string;
  showReplay?: boolean;
  onReplay?: () => void;
  draggable?: boolean;
  defaultPosition?: { x: number; y: number };
  anchor?: BubbleAnchor;
}

export default function PetSpeechBubble({
  current,
  dismiss,
  autoHideMs = DEFAULT_AUTO_HIDE_MS,
  className,
  showReplay = false,
  onReplay,
  draggable = false,
  defaultPosition = { x: 0, y: 0 },
  anchor = "left",
}: PetSpeechBubbleProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, autoHideMs);
    return () => clearTimeout(timer);
  }, [current, autoHideMs, dismiss]);

  useEffect(() => {
    const dragElement = dragRef.current;
    if (!dragElement || !draggable) return;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      
      const rect = bubbleRef.current?.getBoundingClientRect();
      if (!rect) return;

      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const onMouseMove = (ev: MouseEvent) => {
        const newX = ev.clientX - offsetX;
        const newY = ev.clientY - offsetY;
        
        const maxX = window.innerWidth - (bubbleRef.current?.offsetWidth || 300);
        const maxY = window.innerHeight - (bubbleRef.current?.offsetHeight || 100);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      };

      const onMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    dragElement.addEventListener('mousedown', onMouseDown);
    return () => dragElement.removeEventListener('mousedown', onMouseDown);
  }, [draggable]);

  if (!current) return null;

  const chatStyles = {
    left: {
      container: "rounded-2xl rounded-bl-sm",
      bg: "bg-gradient-to-br from-card to-card/95",
      text: "text-foreground",
      border: "border-primary/10",
    },
    right: {
      container: "rounded-2xl rounded-br-sm",
      bg: "bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5",
      text: "text-foreground",
      border: "border-primary/20",
    },
  };

  const style = chatStyles[anchor];

  return (
    <div
      ref={bubbleRef}
      role="status"
      aria-live="polite"
      style={{
        transform: draggable ? `translate(${position.x}px, ${position.y}px)` : 'none',
        position: draggable ? 'fixed' : 'relative',
        zIndex: 9999,
        top: 0,
        left: 0,
        touchAction: 'none',
        maxWidth: '320px',
      }}
      className={cn(
        style.bg,
        style.border,
        "border shadow-elevation-3",
        "px-4 py-3.5 pr-10",
        "transition-shadow duration-200",
        isDragging && "shadow-elevation-4 scale-[1.02]",
        reducedMotion ? "" : "animate-bubble-in",
        style.container,
        className,
      )}
    >
      {/* Текст */}
      <div className="flex items-start gap-2.5">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium leading-relaxed",
            style.text
          )}>
            {current.text}
          </p>
        </div>
      </div>

      {/* Кнопка закрытия */}
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("petSpeech.close")}
        title={t("petSpeech.close")}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <X aria-hidden="true" className="h-3 w-3" />
      </button>

      {showReplay && onReplay && (
        <button
          type="button"
          onClick={onReplay}
          aria-label={t("petSpeech.replay")}
          title={t("petSpeech.replay")}
          className="absolute right-9 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <Volume2 aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
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

  return { current, dismiss };
}
