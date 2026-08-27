import { safeLocalStorage } from '../../lib/safeStorage';

// Масштаб текста (Сессия 6 «три персоны»): у мужчины 40+ из аудита нет
// способа увеличить текст — единственная существующая настройка
// доступности сейчас это системный prefers-reduced-motion. Реализация — одна
// CSS-переменная (--text-scale, см. index.css), умножающая корневой
// font-size; вся rem-based шкала Tailwind (текст, отступы, радиусы) растёт
// вместе с ней, не требуя правки компонентов по одному.
//
// Персистентность — localStorage, а не поле User на бэкенде: это чисто
// клиентская, некритичная настройка отображения того же класса, что уже
// хранятся так же в проекте (companionVisibility.ts, speechBubbleVisibility.ts,
// rewardSound.ts) — ни одна из них не завела поле в БД. Профиль пользователя
// (User.interfaceMode, Сессия 1) синхронизируется через бэкенд только там,
// где значение должно быть одинаковым на всех устройствах и видно серверной
// логике (например, для показа/скрытия игровых уведомлений). Размер текста
// не влияет ни на какую серверную логику, и его расхождение между
// устройствами не создаёт проблемы — как и у /statistics-виджета
// WELLBEING_OPEN_KEY, тоже localStorage.

export const TextScale = {
  Normal: 'normal',
  Large: 'large',
  XLarge: 'xlarge',
} as const;

export type TextScale = (typeof TextScale)[keyof typeof TextScale];

const STORAGE_KEY = 'moodly_text_scale';

// Проверено по аудиту: 1 / 1.125 / 1.25 — обычный / крупный / очень крупный.
export const TEXT_SCALE_MULTIPLIER: Record<TextScale, number> = {
  [TextScale.Normal]: 1,
  [TextScale.Large]: 1.125,
  [TextScale.XLarge]: 1.25,
};

function isTextScale(value: string | null): value is TextScale {
  return value === TextScale.Normal || value === TextScale.Large || value === TextScale.XLarge;
}

function readStoredScale(): TextScale {
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  return isTextScale(stored) ? stored : TextScale.Normal;
}

function applyToDocument(scale: TextScale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--text-scale', String(TEXT_SCALE_MULTIPLIER[scale]));
}

let current: TextScale = readStoredScale();

// Применяется сразу при первом импорте модуля (main.tsx импортирует его до
// первого рендера) — чтобы сохранённый выбор был на экране с первого кадра,
// без вспышки обычного размера.
applyToDocument(current);

export function getTextScale(): TextScale {
  return current;
}

export function setTextScale(scale: TextScale): void {
  current = scale;
  if (scale === TextScale.Normal) {
    // Обычный размер — это default, отдельно в сторедже не храним, как и
    // у остальных булевых client-only настроек в проекте.
    safeLocalStorage.removeItem(STORAGE_KEY);
  } else {
    safeLocalStorage.setItem(STORAGE_KEY, scale);
  }
  applyToDocument(scale);
}
