import { describe, it, expect } from 'vitest';
import type { SafeStorage } from '../safeStorage';
import { readStoredColorTheme, persistColorTheme } from '../colorTheme';

function fakeStorage(): SafeStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    getJSON: (key) => {
      const raw = map.get(key);
      return raw ? (JSON.parse(raw) as never) : null;
    },
    setJSON: (key, value) => {
      map.set(key, JSON.stringify(value));
    },
  };
}

describe('readStoredColorTheme / persistColorTheme', () => {
  it('по умолчанию "warm", хранит валидный выбор, игнорирует мусор в storage', () => {
    const storage = fakeStorage();
    expect(readStoredColorTheme(storage)).toBe('warm');

    persistColorTheme('neon', storage);
    expect(readStoredColorTheme(storage)).toBe('neon');

    storage.setItem('moodly_color_theme', 'not-a-real-theme');
    expect(readStoredColorTheme(storage)).toBe('warm');
  });

  it('дефолтная тема не хранится отдельно в storage', () => {
    const storage = fakeStorage();
    persistColorTheme('bold', storage);
    expect(storage.getItem('moodly_color_theme')).toBe('bold');

    persistColorTheme('warm', storage);
    expect(storage.getItem('moodly_color_theme')).toBeNull();
  });
});
