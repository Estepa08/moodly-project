import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CircleArrowUp, Timer, Wind } from "lucide-react";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface BreathingGuideProps {
  onComplete: (duration: number) => void;
  onCancel: () => void;
}

const PHASES = [
  { key: "inhale", duration: 4000 },
  { key: "hold", duration: 7000 },
  { key: "exhale", duration: 8000 },
] as const;

const TOTAL_CYCLES = 4;

export default function BreathingGuide({ onComplete, onCancel }: BreathingGuideProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [cycle, setCycle] = useState(1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  onCompleteRef.current = onComplete;
  onCancelRef.current = onCancel;

  const phase = PHASES[phaseIdx];
  const isInhale = phase.key === "inhale";
  const isHold = phase.key === "hold";
  const isExhale = phase.key === "exhale";

  const tick = useCallback(() => {
    if (completedRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    const totalPhase = phase.duration;
    const progress = Math.min(elapsed / totalPhase, 1);
    setPhaseProgress(progress);

    if (elapsed >= totalPhase) {
      const nextPhase = phaseIdx + 1;
      if (nextPhase >= PHASES.length) {
        if (cycle >= TOTAL_CYCLES) {
          completedRef.current = true;
          setRunning(false);
          const totalMs = Date.now() - startTimeRef.current + totalPhase;
          onCompleteRef.current(Math.round(totalMs / 1000));
          return;
        }
        setCycle((c) => c + 1);
        setPhaseIdx(0);
      } else {
        setPhaseIdx(nextPhase);
      }
      startTimeRef.current = Date.now();
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [phase.duration, phaseIdx, cycle, phase]);

  useEffect(() => {
    if (running) {
      completedRef.current = false;
      startTimeRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      completedRef.current = true;
    };
  }, [running, tick]);

  useEffect(() => {
    if (!running) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        completedRef.current = true;
        cancelAnimationFrame(rafRef.current);
        setRunning(false);
        onCancelRef.current();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  const circleScale = isInhale ? 0.5 + phaseProgress * 0.5 : isHold ? 1 : 1 - phaseProgress * 0.5;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center w-48 h-48">
        <div
          className={`rounded-full ${reducedMotion ? "" : "transition-all duration-100"}`}
          style={{
            width: `${48 + circleScale * 96}px`,
            height: `${48 + circleScale * 96}px`,
            backgroundColor: isInhale
              ? "hsl(var(--primary) / 0.3)"
              : isHold
                ? "hsl(var(--primary) / 0.3)"
                : "hsl(var(--accent) / 0.3)",
            boxShadow: isExhale ? "0 0 40px hsl(var(--accent) / 0.2)" : "0 0 40px hsl(var(--primary) / 0.2)",
            transition: reducedMotion ? "none" : "background-color 0.4s ease, box-shadow 0.4s ease",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {isInhale ? (
            <CircleArrowUp className="w-14 h-14 text-primary" />
          ) : isHold ? (
            <Timer className="w-14 h-14 text-primary" />
          ) : (
            <Wind className="w-14 h-14 text-primary" />
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-primary font-serif">
          {t(`breathing.${phase.key}`)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("breathing.cycle")} {cycle}/{TOTAL_CYCLES}
        </p>
      </div>

      <div className="flex gap-3">
        {!running ? (
          <button
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl shadow-neumorphic-sm font-medium cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setRunning(true)}
          >
            {t("breathing.start")}
          </button>
        ) : (
          <button
            className="px-6 py-2 bg-destructive text-white rounded-xl shadow-neumorphic-sm font-medium cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              completedRef.current = true;
              cancelAnimationFrame(rafRef.current);
              setRunning(false);
              onCancel();
            }}
          >
            {t("breathing.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
