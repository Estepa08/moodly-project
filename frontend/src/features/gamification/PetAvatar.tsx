import { useState } from "react";
import { Heart } from "lucide-react";
import Lottie from "lottie-react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { PET_DEFINITIONS } from "./pets";
import { usePetAnimation } from "./usePetAnimation";
import { cn } from "../../lib/utils";

export type PetAvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<PetAvatarSize, { box: string; icon: string }> = {
  sm: { box: "w-10 h-10", icon: "text-lg" },
  md: { box: "w-14 h-14", icon: "text-2xl" },
  lg: { box: "w-[72px] h-[72px]", icon: "text-4xl" },
};

interface PetAvatarProps {
  petType?: string;
  size?: PetAvatarSize;
  interactive?: boolean;
  ariaLabel?: string;
  className?: string;
}

export default function PetAvatar({
  petType = "puff",
  size = "md",
  interactive = false,
  ariaLabel,
  className,
}: PetAvatarProps) {
  const isReducedMotion = useReducedMotion();
  const animationData = usePetAnimation(petType);
  const [hearts, setHearts] = useState<number[]>([]);

  const addHeart = () => {
    if (!interactive) return;
    const id = Date.now() + Math.random();
    setHearts((prev) => [...prev, id]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h !== id)), 1400);
  };

  const fallback = PET_DEFINITIONS.find((p) => p.type === petType)?.emoji ?? "🫧";
  const { box, icon } = SIZE_CLASS[size];

  return (
    <button
      type="button"
      onClick={addHeart}
      aria-label={ariaLabel}
      className={cn(
        "relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        interactive && "cursor-pointer active:scale-95 transition-[transform] duration-150",
        className,
      )}
    >
      <span className={cn("block rounded-full bg-secondary", box)} />
      <span className={cn("absolute inset-0 flex items-center justify-center", icon)}>
        {isReducedMotion || !animationData ? (
          <span aria-hidden="true">{fallback}</span>
        ) : (
          <Lottie animationData={animationData} loop autoplay />
        )}
      </span>
      {hearts.map((id) => (
        <Heart
          key={id}
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 top-0 w-5 h-5 fill-primary text-primary animate-bubble-up"
        />
      ))}
    </button>
  );
}
