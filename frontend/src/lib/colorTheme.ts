import { safeLocalStorage, type SafeStorage } from './safeStorage';

// Глобальная цветовая тема приложения (/settings) — 4 палитры, перекрашивающие
// весь UI через CSS-переменные (index.css, [data-color-theme='...'] блоки) на
// <html>. 'warm' — дефолт, единственная тема, следующая за системной тёмной
// темой (prefers-color-scheme); calm/bold/neon — фиксированные скины,
// игнорирующие системную тему (так же, как раньше вели себя одноимённые
// темы карточки дня, см. DailyMotivationCard.tsx).
//
// Персистентность и применение к документу — тот же паттерн, что и у
// features/accessibility/textScale.ts: модуль-синглтон, применяющий значение
// сразу при импорте (main.tsx импортирует его до первого рендера), чтобы
// сохранённая тема была на экране с первого кадра, без вспышки дефолтной.

export const COLOR_THEMES = ['warm', 'calm', 'bold', 'neon'] as const;
export type ColorThemeId = (typeof COLOR_THEMES)[number];

// Превью-цвет темы (кружок-образец в /settings) — не завязан на CSS-переменные,
// потому что должен показывать правильный цвет независимо от того, какая тема
// сейчас активна на документе.
export const COLOR_THEME_SWATCH: Record<ColorThemeId, string> = {
  warm: 'hsl(24 55% 48%)',
  calm: '#7c6fe0',
  bold: '#ff7a45',
  neon: '#b98cff',
};

const STORAGE_KEY = 'moodly_color_theme';
const DEFAULT_THEME: ColorThemeId = 'warm';

function isColorTheme(value: string | null): value is ColorThemeId {
  return (COLOR_THEMES as readonly string[]).includes(value ?? '');
}

export function readStoredColorTheme(storage: SafeStorage = safeLocalStorage): ColorThemeId {
  const stored = storage.getItem(STORAGE_KEY);
  return isColorTheme(stored) ? stored : DEFAULT_THEME;
}

export function persistColorTheme(
  theme: ColorThemeId,
  storage: SafeStorage = safeLocalStorage,
): void {
  if (theme === DEFAULT_THEME) {
    // Дефолтная тема — не храним отдельно, как и у остальных клиентских
    // настроек отображения в проекте (textScale, companionVisibility и т.д.).
    storage.removeItem(STORAGE_KEY);
  } else {
    storage.setItem(STORAGE_KEY, theme);
  }
}

function applyToDocument(theme: ColorThemeId): void {
  if (typeof document === 'undefined') return;
  if (theme === DEFAULT_THEME) {
    document.documentElement.removeAttribute('data-color-theme');
  } else {
    document.documentElement.setAttribute('data-color-theme', theme);
  }
}

let current: ColorThemeId = readStoredColorTheme();

// Применяется сразу при первом импорте модуля — см. комментарий выше.
applyToDocument(current);

export function getColorTheme(): ColorThemeId {
  return current;
}

export function setColorTheme(theme: ColorThemeId): void {
  current = theme;
  persistColorTheme(theme);
  applyToDocument(theme);
}
