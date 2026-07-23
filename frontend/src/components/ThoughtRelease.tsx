import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trash2, ChevronRight } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "../lib/api-types";
import { suggestDistortion } from "../lib/distortionKeywordHints";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type Entry = components["schemas"]["Entry"];

interface ThoughtReleaseProps {
  parameterId: string | undefined;
  createEntry: UseMutationResult<
    Entry,
    Error,
    { parameterId: string; value: number; note?: string },
    unknown
  >;
}

const DRAG_THRESHOLD = 90;

export default function ThoughtRelease({ parameterId, createEntry }: ThoughtReleaseProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [thought, setThought] = useState("");
  const [showHintDetail, setShowHintDetail] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [released, setReleased] = useState(false);
  const [crumpling, setCrumpling] = useState(false);
  const dragStartX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const hintKey = thought.trim().length > 0 ? suggestDistortion(thought) : null;

  const logRelease = (distortionKey: string | null) => {
    if (parameterId && distortionKey) {
      createEntry.mutate({ parameterId, value: 1, note: distortionKey });
    }
  };

  const CRUMPLE_MS = 160;
  const FALL_MS = 300;

  const finishRelease = () => {
    logRelease(hintKey);
    setReleased(true);
    toast.success(t("distortions.letGo.released"));

    if (reducedMotion) {
      window.setTimeout(() => {
        setThought("");
        setShowHintDetail(false);
        setDragX(0);
        setReleased(false);
      }, 150);
      return;
    }

    setCrumpling(true);
    window.setTimeout(() => setCrumpling(false), CRUMPLE_MS);
    window.setTimeout(() => {
      setThought("");
      setShowHintDetail(false);
      setDragX(0);
      setReleased(false);
    }, CRUMPLE_MS + FALL_MS);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!thought.trim()) return;
    dragStartX.current = e.clientX;
    setDragging(true);
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragX(e.clientX - dragStartX.current);
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) >= DRAG_THRESHOLD) {
      finishRelease();
    } else {
      setDragX(0);
    }
  };

  const canRelease = thought.trim().length > 0 && !released;
  const dragProgress = released ? 1 : Math.min(Math.abs(dragX) / DRAG_THRESHOLD, 1);

  return (
    <div className="space-y-4">
      <Card className="shadow-neumorphic">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder={t("distortions.letGo.placeholder")}
              rows={3}
              disabled={released}
              className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-neumorphic-inset transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />

            {hintKey && !released && (
              <div className="bg-muted/30 rounded-lg px-3 py-2 space-y-1.5">
                <p className="text-sm text-foreground">
                  {t("distortions.letGo.hintQuestion", { distortion: t(`cognitiveDistortions.${hintKey}`) })}
                </p>
                <button
                  type="button"
                  aria-expanded={showHintDetail}
                  onClick={() => setShowHintDetail((v) => !v)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showHintDetail && "rotate-90")} />
                  {showHintDetail ? t("distortions.hideExample") : t("distortions.showExample")}
                </button>
                {showHintDetail && (
                  <p className="text-xs text-muted-foreground">
                    {t(`distortionsLibrary.${hintKey}.reframe`)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 py-2">
            <div
              ref={cardRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                transform: crumpling
                  ? `translateX(${dragX}px) scaleX(0.55) scaleY(0.7) rotate(${dragX >= 0 ? 14 : -14}deg)`
                  : released
                    ? `translateY(56px) scaleX(0.14) scaleY(0.16) rotate(${dragX >= 0 ? 30 : -30}deg)`
                    : `translateX(${dragX}px) rotate(${dragX / 12}deg)`,
                opacity: released && !crumpling ? 0 : crumpling ? 0.9 : 1 - Math.min(Math.abs(dragX) / 220, 0.6),
                borderRadius: crumpling || released ? "9999px" : undefined,
                transition: dragging
                  ? "none"
                  : reducedMotion
                    ? "opacity 150ms ease"
                    : crumpling
                      ? `transform ${CRUMPLE_MS}ms ease-out`
                      : released
                        ? `transform ${FALL_MS}ms ease-in, opacity ${FALL_MS}ms ease-in, border-radius ${FALL_MS}ms ease-in`
                        : "transform 250ms ease, opacity 250ms ease",
                touchAction: "pan-y",
              }}
              className={cn(
                "w-full max-w-xs rounded-xl bg-muted/50 shadow-neumorphic-sm px-4 py-3 text-center text-sm text-foreground select-none",
                canRelease ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50",
              )}
              aria-hidden="true"
            >
              {thought.trim() || t("distortions.letGo.emptyCard")}
            </div>

            <div
              className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150"
              style={{
                backgroundColor: `hsl(var(--destructive) / ${0.08 + dragProgress * 0.22})`,
                transform: `scale(${1 + dragProgress * 0.2})`,
              }}
              aria-hidden="true"
            >
              <Trash2
                className="w-5 h-5 text-muted-foreground transition-colors duration-150"
                style={{
                  color:
                    dragProgress > 0
                      ? `hsl(var(--destructive) / ${0.5 + dragProgress * 0.5})`
                      : undefined,
                }}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t("distortions.letGo.dragHint")}
            </p>

            <Button
              variant="outline"
              disabled={!canRelease}
              onClick={finishRelease}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t("distortions.letGo.releaseButton")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
