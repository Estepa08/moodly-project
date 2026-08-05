import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReveal, type RevealDirection } from "../hooks/useReveal";
import { cn } from "../lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
  as?: ElementType;
}

/**
 * Scroll-reveal обёртка: элемент плавно появляется при входе во вьюпорт.
 * direction — сдвиг (up/left/right/fade); delay — стаггер в мс.
 */
export default function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const { ref, revealClassName, delayStyle } = useReveal<HTMLDivElement>({ delay });
  return (
    <Tag
      ref={ref}
      className={cn(revealClassName, `reveal-${direction}`, className)}
      style={(delay ? delayStyle : undefined) as CSSProperties | undefined}
    >
      {children}
    </Tag>
  );
}
