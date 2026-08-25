import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Options as ConfettiOptions } from 'canvas-confetti';

// canvas-confetti рисует на <canvas> — CSS `var(--token)` там не резолвится
// (нет каскада), поэтому `colors` передаются как имена дизайн-токенов
// (например 'chart-4', 'accent') и разворачиваются здесь в текущее
// вычисленное значение через getComputedStyle. Так конфетти автоматически
// остаётся в палитре «тихого кабинета» и следует за светлой/тёмной темой.
function resolveTokenColor(token: string): string {
  if (typeof window === 'undefined') return token;
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  return value ? `hsl(${value})` : token;
}

// Tier 3 (docs/gamification-phase2-visuals.svg, ряд 2): единственное место
// во всём проекте, где используется canvas-confetti — полноэкранный
// оверлей-канвас поверх страницы, вызывается только на редких, крупных
// событиях (вехи стрика 30/100 дней), не на каждый чек-ин/клик.
// Решение о том, звать ли burst вообще (useReducedMotion), принимает
// вызывающий компонент — хук сам не проверяет reduced-motion.
export function useConfettiBurst() {
  return useCallback((options: ConfettiOptions) => {
    const resolved = options.colors
      ? { ...options, colors: options.colors.map(resolveTokenColor) }
      : options;
    void confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, ...resolved });
  }, []);
}
