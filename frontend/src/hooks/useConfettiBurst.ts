import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Options as ConfettiOptions } from 'canvas-confetti';

// Tier 3 (docs/gamification-phase2-visuals.svg, ряд 2): единственное место
// во всём проекте, где используется canvas-confetti — полноэкранный
// оверлей-канвас поверх страницы, вызывается только на редких, крупных
// событиях (вехи стрика 30/100 дней), не на каждый чек-ин/клик.
// Решение о том, звать ли burst вообще (useReducedMotion), принимает
// вызывающий компонент — хук сам не проверяет reduced-motion.
export function useConfettiBurst() {
  return useCallback((options: ConfettiOptions) => {
    void confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, ...options });
  }, []);
}
