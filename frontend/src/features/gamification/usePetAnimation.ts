import { useEffect, useState } from 'react';
import { getPetAnimations, type PetEmotion } from './pets';

export function usePetAnimation(petType: string, emotion: PetEmotion = 'idle') {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const requested = getPetAnimations(petType, emotion);
    const pool = requested.length > 0 ? requested : getPetAnimations(petType, 'idle');

    // Нет ни одной Lottie-анимации для этого типа (например «puff» без своей
    // папки) — не подменяем чужой заглушкой-анимацией, отдаём null, чтобы
    // вызывающий компонент показал эмодзи-аватар питомца (см. PetAvatar/PetCard).
    if (pool.length === 0) {
      setData(null);
      return;
    }

    const load = pool[Math.floor(Math.random() * pool.length)];
    load().then((module) => {
      if (!cancelled) setData(module.default);
    });

    return () => {
      cancelled = true;
    };
  }, [petType, emotion]);

  return data;
}
