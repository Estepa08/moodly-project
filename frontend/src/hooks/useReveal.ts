import { useEffect, useRef, useState } from "react";

/**
 * Лёгкий scroll-reveal на IntersectionObserver (0 зависимостей).
 * Добавляет класс `reveal-visible`, когда элемент входит во вьюпорт.
 * Уважает prefers-reduced-motion.
 */
export const REVEAL_DIRECTIONS = ["up", "left", "right", "fade"] as const;
export type RevealDirection = (typeof REVEAL_DIRECTIONS)[number];

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: { once?: boolean; threshold?: number; delay?: number } = {},
) {
  const { once = true, threshold = 0.15, delay = 0 } = options;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced.current) {
      setVisible(true);
      return;
    }

    const target = el;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [once, threshold]);

  const revealClassName = `reveal reveal-${visible ? "visible" : "hidden"}${
    reduced.current ? " reveal-reduced" : ""
  }`;

  return {
    ref,
    visible,
    revealClassName,
    delayStyle: delay ? { transitionDelay: `${delay}ms` } : undefined,
  };
}
