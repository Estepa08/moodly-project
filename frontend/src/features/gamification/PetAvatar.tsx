import { useEffect, useRef, useState, type CSSProperties } from "react";
import Lottie from "lottie-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { PET_DEFINITIONS, hasPetEmotion, type PetEmotion } from "./pets";
import { usePetAnimation } from "./usePetAnimation";
import { cn } from "../../lib/utils";

export type PetAvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<PetAvatarSize, { box: string; icon: string }> = {
  sm: { box: "w-[60px] h-[60px]", icon: "text-2xl" },
  md: { box: "w-[72px] h-[72px]", icon: "text-3xl" },
  lg: { box: "w-24 h-24", icon: "text-5xl" },
};

const FEED_ITEM_COUNT = 6;
const BUBBLE_LIFETIME_MS = 3200;

type BubbleDepth = "over" | "under";

interface BubbleTrajectory {
  swayA: number;
  swayB: number;
  tilt: number;
  by: number;
}

interface FloatItem {
  id: number;
  emoji: string;
  offset: number;
  delay: number;
  depth: BubbleDepth;
  trajectory: BubbleTrajectory;
}

interface PetAvatarProps {
  petType?: string;
  size?: PetAvatarSize;
  emotion?: PetEmotion;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Смена значения запускает анимацию «кормления»: еда падает сверху на питомца */
  feedSignal?: number;
  /** Доп. обработчик тапа по питомцу (вызывается вместе с декоративными пузырями) */
  onTap?: () => void;
  /** Обрезает еду/пузыри по кругу аватара (для тостов и шапки теста — ничего не вылетает наружу) */
  contained?: boolean;
  /** Убирает фон-кружок (питомец на прозрачной подложке) */
  plain?: boolean;
}

export default function PetAvatar({
  petType = "puff",
  size = "md",
  emotion = "idle",
  interactive = false,
  ariaLabel,
  className,
  feedSignal,
  onTap,
  contained = false,
  plain = false,
}: PetAvatarProps) {
  const isReducedMotion = useReducedMotion();
  const animationData = usePetAnimation(petType, emotion);
  const [bubbles, setBubbles] = useState<FloatItem[]>([]);
  const [feedItems, setFeedItems] = useState<FloatItem[]>([]);
  const [squashing, setSquashing] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const definition = PET_DEFINITIONS.find((p) => p.type === petType);
  const feedEmojis = definition?.feed ?? ["🫧"];

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const pickEmoji = () => feedEmojis[Math.floor(Math.random() * feedEmojis.length)];

  const spawnBubble = () => {
    if (!interactive) return;
    const id = Date.now() + Math.random();
    const depth: BubbleDepth = Math.random() > 0.5 ? "over" : "under";
    const trajectory: BubbleTrajectory = {
      swayA: Math.random() * 40 - 20,
      swayB: Math.random() * 60 - 30,
      tilt: (Math.random() - 0.5) * 36,
      by: -(220 + Math.random() * 70),
    };
    setBubbles((prev) => [
      ...prev,
      {
        id,
        emoji: pickEmoji(),
        offset: Math.random() * 60 - 30,
        delay: 0,
        depth,
        trajectory,
      },
    ]);
    const timer = setTimeout(
      () => setBubbles((prev) => prev.filter((b) => b.id !== id)),
      BUBBLE_LIFETIME_MS,
    );
    timersRef.current.push(timer);
  };

  const triggerSquash = () => {
    if (isReducedMotion) return;
    setSquashing(false);
    requestAnimationFrame(() => setSquashing(true));
    const timer = setTimeout(() => setSquashing(false), 380);
    timersRef.current.push(timer);
  };

  useEffect(() => {
    if (!feedSignal || isReducedMotion) return;
    clearTimers();

    const items: FloatItem[] = Array.from({ length: FEED_ITEM_COUNT }, (_, i) => ({
      id: Date.now() + i,
      emoji: feedEmojis[i % feedEmojis.length],
      offset: (i % 5) * 10 - 20,
      delay: i * 130,
      depth: "under",
      trajectory: { swayA: 0, swayB: 0, tilt: 0, by: -260 },
    }));
    setFeedItems(items);

    items.forEach((item, i) => {
      const removeTimer = setTimeout(
        () => setFeedItems((prev) => prev.filter((f) => f.id !== item.id)),
        1500 + item.delay,
      );
      timersRef.current.push(removeTimer);
      const squashTimer = setTimeout(triggerSquash, 220 + i * 150);
      timersRef.current.push(squashTimer);
    });

    const clearTimer = setTimeout(() => setFeedItems([]), 2300);
    timersRef.current.push(clearTimer);

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedSignal]);

  const fallback = PET_DEFINITIONS.find((p) => p.type === petType)?.emoji ?? "🫧";
  const { box, icon } = SIZE_CLASS[size];

  const showPetBounce =
    emotion === "happy" && !hasPetEmotion(petType, "happy") && !isReducedMotion && !!animationData;

  return (
    <button
      type="button"
      onClick={() => {
        spawnBubble();
        onTap?.();
      }}
      aria-label={ariaLabel}
      className={cn(
        "relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        contained && "overflow-hidden",
        interactive && "cursor-pointer active:scale-95 transition-[transform] duration-150",
        squashing && "animate-pet-squash",
        className,
      )}
    >
      <span className={cn("block rounded-full", plain ? "bg-transparent" : "bg-secondary", box)} />
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          icon,
          showPetBounce && "animate-pet-happy",
        )}
      >
        {isReducedMotion || !animationData ? (
          <span aria-hidden="true">{fallback}</span>
        ) : (
          <Lottie animationData={animationData} loop autoplay />
        )}
      </span>

      {bubbles.map((b) => (
        <span
          key={b.id}
          aria-hidden="true"
          className={cn(
            "absolute left-1/2 top-0 w-6 h-6 flex items-center justify-center text-lg animate-bubble-up pointer-events-none",
            b.depth === "over" && "z-20",
          )}
          style={
            {
              marginLeft: b.offset,
              "--by": `${b.trajectory.by}px`,
            } as CSSProperties
          }
        >
          <span
            className="animate-bubble-sway"
            style={
              {
                "--sway-a": `${b.trajectory.swayA}px`,
                "--sway-b": `${b.trajectory.swayB}px`,
                "--tilt": `${b.trajectory.tilt}deg`,
              } as CSSProperties
            }
          >
            {b.emoji}
          </span>
        </span>
      ))}

      {feedItems.map((item) => (
        <span
          key={item.id}
          aria-hidden="true"
          className="absolute left-1/2 top-[30%] w-6 h-6 flex items-center justify-center text-lg animate-feed-fall pointer-events-none"
          style={{ marginLeft: item.offset, animationDelay: `${item.delay}ms` }}
        >
          {item.emoji}
        </span>
      ))}
    </button>
  );
}
