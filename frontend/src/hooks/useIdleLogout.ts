import { useEffect, useRef } from 'react';

// События активности пользователя: любое из них сбрасывает таймер бездействия.
const ACTIVITY_EVENTS = [
  'pointerdown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
] as const;

/**
 * Автологаут по бездействию: если в течение `timeoutMs` не было активности
 * пользователя (клики, движение мыши, ввод с клавиатуры, скролл, тач) —
 * вызывается `onIdle`.
 *
 * Проверка идёт через интервал + событие `visibilitychange`, поэтому задержка
 * срабатывает корректно даже если вкладка была свёрнута (таймеры браузера
 * тормозятся, а проверка по факту возврата во вкладку всё равно сработает).
 */
export function useIdleLogout(onIdle: () => void, timeoutMs: number) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    const lastActiveAt = { value: Date.now() };
    let fired = false;

    const reset = () => {
      lastActiveAt.value = Date.now();
      fired = false;
    };

    const check = () => {
      if (fired) return;
      if (Date.now() - lastActiveAt.value >= timeoutMs) {
        fired = true;
        onIdleRef.current();
      }
    };

    const interval = setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);

    const onActivity = () => reset();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [timeoutMs]);
}
