import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { PET_DEFINITIONS, hasPetEmotion, type PetEmotion } from "./pets";
import { usePetAnimation } from "./usePetAnimation";
import { cn } from "../../lib/utils";

export type PetAvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<PetAvatarSize, { box: string; icon: string }> = {
  sm: { box: "w-12 h-12", icon: "text-xl" },
  md: { box: "w-[72px] h-[72px]", icon: "text-3xl" },
  lg: { box: "w-24 h-24", icon: "text-5xl" },
};

const FEED_ITEM_COUNT = 6;

interface FloatItem {
  id: number;
  emoji: string;
  offset: number;
  delay: number;
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
  /** Обрезает еду/пузыри по кругу аватара (для тостов и шапки теста — ничего не вылетает наружу) */
  contained?: boolean;
}

export default function PetAvatar({
  petType = "puff",
  size = "md",
  emotion = "idle",
  interactive = false,
  ariaLabel,
  className,
  feedSignal,
  contained = false,
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
    setBubbles((prev) => [
      ...prev,
      { id, emoji: pickEmoji(), offset: Math.random() * 24 - 12, delay: 0 },
    ]);
    const timer = setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 1800);
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
      onClick={spawnBubble}
      aria-label={ariaLabel}
      className={cn(
        "relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        contained && "overflow-hidden",
        interactive && "cursor-pointer active:scale-95 transition-[transform] duration-150",
        squashing && "animate-pet-squash",
        className,
      )}
    >
      <span className={cn("block rounded-full bg-secondary", box)} />
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
          className="absolute left-1/2 top-0 w-6 h-6 flex items-center justify-center text-lg animate-bubble-up"
          style={{ marginLeft: b.offset }}
        >
          {b.emoji}
        </span>
      ))}

      {feedItems.map((item) => (
        <span
          key={item.id}
          aria-hidden="true"
          className="absolute left-1/2 top-[30%] w-6 h-6 flex items-center justify-center text-lg animate-feed-fall"
          style={{ marginLeft: item.offset, animationDelay: `${item.delay}ms` }}
        >
          {item.emoji}
        </span>
      ))}
    </button>
  );
}
