import { useEffect, useRef, useState, useCallback } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import type { AnimationItem } from "lottie-web";
import { Heart, HelpCircle } from "lucide-react";
import animationData from "../assets/lottie/breathing-creature.json";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface Reaction {
  id: number;
  type: "heart" | "question" | "dizzy";
  x: number;
}

interface BreathingCreatureProps {
  calmness: number;
  size?: number;
  breathingPhase?: "inhale" | "hold" | "exhale";
  breathingProgress?: number;
  // while an actual breathing session is running we don't want the octopus scooting around
  // after the cursor (it fights for attention with the breathing guide and can drift toward
  // wherever the user's mouse settled, e.g. near the cancel button) — default true for the
  // idle/done screens where the playful cursor-follow is the point
  followCursor?: boolean;
}

// how far the pupils are allowed to drift from their baked position, in the
// animation's own 500x500 coordinate space
const PUPIL_RANGE = 15;

const REACTION_DURATION = 3200;
const INACTIVITY_DELAY = 10_000;
const CLICK_THRESHOLD = 15;
const CLICK_WINDOW = 5000;

let nextReactionId = 0;

export default function BreathingCreature({
  size = 200,
  followCursor = true,
}: BreathingCreatureProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const followCursorRef = useRef(followCursor);
  const lastActivityRef = useRef(Date.now());
  const questionSpawnedRef = useRef(false);
  const clickTimestampsRef = useRef<number[]>([]);
  const dizzyActiveRef = useRef(false);
  followCursorRef.current = followCursor;

  const [reactions, setReactions] = useState<Reaction[]>([]);

  const spawnReaction = useCallback((type: "heart" | "question" | "dizzy") => {
    if (type === "dizzy") dizzyActiveRef.current = true;
    const id = nextReactionId++;
    const x = (Math.random() - 0.5) * 30;
    setReactions((prev) => [...prev, { id, type, x }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
      if (type === "dizzy") dizzyActiveRef.current = false;
    }, REACTION_DURATION);
  }, []);

  const handleClick = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    questionSpawnedRef.current = false;

    const timestamps = clickTimestampsRef.current;
    timestamps.push(now);
    const cutoff = now - CLICK_WINDOW;
    clickTimestampsRef.current = timestamps.filter((t) => t > cutoff);

    if (dizzyActiveRef.current) return;

    if (clickTimestampsRef.current.length >= CLICK_THRESHOLD) {
      clickTimestampsRef.current = [];
      spawnReaction("dizzy");
    } else {
      spawnReaction("heart");
    }
  }, [spawnReaction]);

  // inactivity timer — spawns a question mark after 10s without mouse activity
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      if (
        followCursorRef.current &&
        Date.now() - lastActivityRef.current > INACTIVITY_DELAY &&
        !questionSpawnedRef.current
      ) {
        questionSpawnedRef.current = true;
        spawnReaction("question");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [reducedMotion, spawnReaction]);

  // the octopus scoots left/right after the cursor, as if paddling itself with its tentacles:
  // a noticeable horizontal drift, a lean into the direction of travel, and a squash/stretch +
  // playback speed-up while it's actively "swimming" that settles once it catches up
  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let prevX = 0;

    const onMove = (e: MouseEvent) => {
      lastActivityRef.current = Date.now();
      questionSpawnedRef.current = false;
      const px = (e.clientX / window.innerWidth) * 2 - 1;
      const py = Math.max(-0.4, Math.min(0.4, -(e.clientY / window.innerHeight) * 2 + 1));
      pointerRef.current = { x: px, y: py };
      if (followCursorRef.current) {
        targetX = px;
        targetY = py;
      }
    };
    window.addEventListener("mousemove", onMove);

    const tick = () => {
      // settle back to center (rather than freezing in place) once cursor-follow is turned off
      if (!followCursorRef.current) {
        targetX = 0;
        targetY = 0;
      }
      prevX = x;
      x += (targetX - x) * 0.05;
      y += (targetY - y) * 0.06;
      const velocity = x - prevX;
      const effort = Math.min(1, Math.abs(velocity) * 22);

      if (containerRef.current) {
        const squashX = 1 - effort * 0.07;
        const squashY = 1 + effort * 0.05;
        containerRef.current.style.transform = `translate(${
          x * 30
        }px, ${-y * 8}px) rotate(${x * 6}deg) scale(${squashX}, ${squashY})`;
      }
      lottieRef.current?.setSpeed(1 + effort * 0.7);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  // eyes track the cursor: nudge the "pupilas" layer's rendered transform each frame,
  // on top of whatever the baked animation is already doing (idle look/blink keyframes)
  useEffect(() => {
    if (reducedMotion) return;

    // lottie-web internals aren't typed; reach into the SVG renderer's per-layer elements
    type RenderElement = { data?: { nm?: string }; layerElement?: SVGGElement };
    type InternalAnim = { renderer?: { elements?: RenderElement[] } };

    let anim: AnimationItem | undefined;
    let cancelled = false;
    let raf = 0;
    let cleanup: (() => void) | undefined;

    const setup = () => {
      if (cancelled) return;
      anim = lottieRef.current?.animationItem;
      if (!anim) {
        raf = requestAnimationFrame(setup);
        return;
      }

      const findPupilElement = () => {
        const renderer = (anim as unknown as InternalAnim).renderer;
        return renderer?.elements?.find((el) => el.data?.nm === "pupilas")?.layerElement;
      };

      const onDrawnFrame = () => {
        const pupilEl = findPupilElement();
        if (!pupilEl) return;
        const dx = pointerRef.current.x * PUPIL_RANGE;
        const dy = -pointerRef.current.y * PUPIL_RANGE;
        // lottie rewrites this element's `transform` *attribute* every frame from the baked
        // keyframes (its own idle look/blink motion) and there's no reliable point to hook in
        // and out-race that write. A CSS `transform` on an SVG element wins over the attribute
        // unconditionally, so we read this frame's baked position out of the attribute and
        // re-apply it via CSS with our cursor offset added — that preserves the baked motion
        // while guaranteeing our offset always sticks.
        const baked = new DOMMatrix(pupilEl.getAttribute("transform") ?? undefined);
        const combined = baked.translate(dx, dy);
        pupilEl.style.transform = combined.toString();
      };

      anim.addEventListener("drawnFrame", onDrawnFrame);
      cleanup = () => anim?.removeEventListener("drawnFrame", onDrawnFrame);
    };
    raf = requestAnimationFrame(setup);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [reducedMotion]);

  return (
    <div style={{ width: size, height: size }} className="mx-auto select-none relative pt-2">
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{
          width: "100%",
          height: "100%",
          willChange: "transform",
        }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop
          autoplay={!reducedMotion}
          style={{ width: "100%", height: "100%", cursor: "pointer" }}
        />
      </div>

      {!reducedMotion && (
        <div className="absolute -top-20 -left-4 -right-4 -bottom-4 pointer-events-none overflow-visible z-20">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="absolute left-1/2 -translate-x-1/2 top-[35%] w-10 h-10 rounded-full bg-card shadow-neumorphic-sm flex items-center justify-center animate-bubble-up"
              style={{ marginLeft: r.x }}
            >
              {r.type === "dizzy" ? (
                <span className="text-lg">🌀</span>
              ) : r.type === "heart" ? (
                <Heart className="w-4 h-4 text-accent" strokeWidth={2.5} />
              ) : (
                <HelpCircle className="w-4 h-4 text-primary" strokeWidth={2.5} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
