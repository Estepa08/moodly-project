import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleArrowUp, Timer, Wind } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Button } from '../../components/ui/button';
import { SegmentGroup, SegmentButton } from '../../components/ui/segment-button';
import { BreathPhase, BreathingTechnique } from './breathing.enums';

interface BreathingGuideProps {
  onComplete: (duration: number) => void;
  onCancel: () => void;
  autoStart?: boolean;
  technique?: BreathingTechnique;
  onBreathChange?: (phase: BreathPhase, progress: number) => void;
}

interface PhaseConfig {
  key: BreathPhase;
  duration: number;
}

const BREATHING_PATTERNS: Record<BreathingTechnique, { phases: readonly PhaseConfig[] }> = {
  [BreathingTechnique.Box]: {
    phases: [
      { key: BreathPhase.Inhale, duration: 4000 },
      { key: BreathPhase.Hold, duration: 4000 },
      { key: BreathPhase.Exhale, duration: 4000 },
      { key: BreathPhase.Hold, duration: 4000 },
    ],
  },
  [BreathingTechnique.FourSevenEight]: {
    phases: [
      { key: BreathPhase.Inhale, duration: 4000 },
      { key: BreathPhase.Hold, duration: 7000 },
      { key: BreathPhase.Exhale, duration: 8000 },
    ],
  },
  [BreathingTechnique.Quick]: {
    phases: [
      { key: BreathPhase.Inhale, duration: 2000 },
      { key: BreathPhase.Exhale, duration: 6000 },
    ],
  },
};

const TOTAL_CYCLES = 4;

export default function BreathingGuide({
  onComplete,
  onCancel,
  autoStart,
  technique: initialTechnique,
  onBreathChange,
}: BreathingGuideProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [technique, setTechnique] = useState<BreathingTechnique>(
    initialTechnique ?? BreathingTechnique.Box,
  );
  const [cycle, setCycle] = useState(1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [running, setRunning] = useState(autoStart ?? false);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  const onBreathChangeRef = useRef(onBreathChange);
  onCompleteRef.current = onComplete;
  onCancelRef.current = onCancel;
  onBreathChangeRef.current = onBreathChange;

  const phases = BREATHING_PATTERNS[technique].phases;
  const phase = phases[phaseIdx];
  const isInhale = phase.key === BreathPhase.Inhale;
  const isHold = phase.key === BreathPhase.Hold;
  const isExhale = phase.key === BreathPhase.Exhale;

  const tick = useCallback(() => {
    if (completedRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    const totalPhase = phase.duration;
    const progress = Math.min(elapsed / totalPhase, 1);
    setPhaseProgress(progress);
    onBreathChangeRef.current?.(phase.key, progress);

    if (elapsed >= totalPhase) {
      const nextPhase = phaseIdx + 1;
      if (nextPhase >= phases.length) {
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
  }, [phaseIdx, cycle, phase, phases.length]);

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
      if (e.key === 'Escape') {
        completedRef.current = true;
        cancelAnimationFrame(rafRef.current);
        setRunning(false);
        onCancelRef.current();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [running]);

  const circleScale = reducedMotion
    ? 0.75
    : isInhale
      ? 0.5 + phaseProgress * 0.5
      : isHold
        ? 1
        : 1 - phaseProgress * 0.5;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center w-40 h-40">
        <div
          className={`rounded-full ${reducedMotion ? '' : 'transition-[width,height] duration-100'}`}
          style={{
            width: `${40 + circleScale * 80}px`,
            height: `${40 + circleScale * 80}px`,
            backgroundColor:
              isInhale || isHold ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--accent) / 0.3)',
            boxShadow: isExhale
              ? '0 0 40px hsl(var(--accent) / 0.2)'
              : '0 0 40px hsl(var(--primary) / 0.2)',
            transition: reducedMotion ? 'none' : 'background-color 0.4s ease, box-shadow 0.4s ease',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {isInhale ? (
            <CircleArrowUp aria-hidden="true" className="w-14 h-14 text-primary" />
          ) : isHold ? (
            <Timer aria-hidden="true" className="w-14 h-14 text-primary" />
          ) : (
            <Wind aria-hidden="true" className="w-14 h-14 text-primary" />
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {Array.from({ length: TOTAL_CYCLES }, (_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-[background-color,box-shadow] duration-300 ${
              i + 1 < cycle
                ? 'bg-accent'
                : i + 1 === cycle
                  ? 'bg-primary shadow-neumorphic-sm'
                  : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-primary font-serif">
          {t(`breathing.${phase.key}`)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t('breathing.cycle')} {cycle}/{TOTAL_CYCLES}
        </p>
      </div>

      <div className="flex gap-3">
        {!running ? (
          <>
            <SegmentGroup>
              <SegmentButton
                active={technique === BreathingTechnique.Box}
                onClick={() => setTechnique(BreathingTechnique.Box)}
              >
                {t('breathing.techniqueBox')}
              </SegmentButton>
              <SegmentButton
                active={technique === BreathingTechnique.FourSevenEight}
                onClick={() => setTechnique(BreathingTechnique.FourSevenEight)}
              >
                {t('breathing.technique478')}
              </SegmentButton>
              <SegmentButton
                active={technique === BreathingTechnique.Quick}
                onClick={() => setTechnique(BreathingTechnique.Quick)}
              >
                {t('breathing.techniqueQuick')}
              </SegmentButton>
            </SegmentGroup>
            <Button onClick={() => setRunning(true)}>{t('breathing.start')}</Button>
          </>
        ) : (
          <Button
            variant="destructive"
            onClick={() => {
              completedRef.current = true;
              cancelAnimationFrame(rafRef.current);
              setRunning(false);
              onCancel();
            }}
          >
            {t('breathing.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}
