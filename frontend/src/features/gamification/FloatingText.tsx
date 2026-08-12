import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

interface FloatingTextProps {
  text: string;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export default function FloatingText({
  text,
  duration = 2000,
  onComplete,
  className,
}: FloatingTextProps) {
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Случайное смещение для каждой фразы
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = -40 - Math.random() * 40;

    setPosition({ x: offsetX, y: offsetY });

    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed pointer-events-none z-[9999]",
        "text-lg font-bold",
        "animate-float-up",
        className,
      )}
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {text}
    </div>
  );
}
