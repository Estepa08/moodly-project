// Пульс бейджа энергии (⚡ NN): PetRewardParticles «долетает» текстом
// награды до ближайшего [data-role="pet-energy-badge"] на странице и в
// момент касания шлёт этот сигнал — бейдж, если он есть на экране,
// подсвечивается коротким bounce (см. animate-energy-pulse в index.css).
// Простой pub/sub по тому же паттерну, что и speechBubbleVisibility.ts —
// компоненты живут в разных ветках дерева, общий контекст тут избыточен.

import { useEffect, useRef, useState } from 'react';

type Listener = () => void;

const listeners = new Set<Listener>();

export function emitEnergyPulse() {
  for (const listener of listeners) listener();
}

export function subscribeEnergyPulse(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Подписка бейджа энергии на пульс: возвращает true на `durationMs`
// после каждого emitEnergyPulse() — вешать как класс animate-energy-pulse.
export function usePetEnergyPulse(durationMs = 420): boolean {
  const [pulsing, setPulsing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeEnergyPulse(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPulsing(false);
      requestAnimationFrame(() => setPulsing(true));
      timerRef.current = setTimeout(() => setPulsing(false), durationMs);
    });
    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return pulsing;
}
