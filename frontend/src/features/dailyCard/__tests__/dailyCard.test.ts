import { describe, it, expect } from 'vitest';
import type { SafeStorage } from '../../../lib/safeStorage';
import {
  getOrCreateAnchorDateKey,
  getDayNumber,
  getDayNumberForDateKey,
  getTodayCard,
  getCardRange,
  getNextMidnight,
  isOpenedToday,
  markOpenedToday,
  isCardOpened,
  markCardOpened,
  getFavorites,
  isFavorite,
  toggleFavorite,
  removeFavorite,
} from '../dailyCard';

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

describe('getOrCreateAnchorDateKey', () => {
  it('создаёт anchor при первом обращении и переиспользует его дальше', () => {
    const storage = fakeStorage();
    const first = getOrCreateAnchorDateKey(new Date('2026-03-01T10:00:00'), storage);
    expect(first).toBe('2026-03-01');

    const second = getOrCreateAnchorDateKey(new Date('2026-03-05T10:00:00'), storage);
    expect(second).toBe('2026-03-01');
  });
});

describe('getDayNumber', () => {
  it('day 1 в день anchor, растёт на 1 каждые календарные сутки', () => {
    const anchor = '2026-03-01';
    expect(getDayNumber(anchor, new Date('2026-03-01T23:50:00'))).toBe(1);
    expect(getDayNumber(anchor, new Date('2026-03-02T00:05:00'))).toBe(2);
    expect(getDayNumber(anchor, new Date('2026-03-10T12:00:00'))).toBe(10);
  });

  it('циклически повторяется после 365 дней', () => {
    const anchor = '2026-01-01';
    const dayAfterYear = new Date('2026-01-01T00:00:00');
    dayAfterYear.setDate(dayAfterYear.getDate() + 365);
    expect(getDayNumber(anchor, dayAfterYear)).toBe(1);
  });
});

describe('getTodayCard', () => {
  it('возвращает карточку day 1 в день первого визита', () => {
    const storage = fakeStorage();
    const card = getTodayCard(new Date('2026-03-01T09:00:00'), storage);
    expect(card.day).toBe(1);
    expect(card.principle).toBe('autonomy');
    expect(card.text.length).toBeGreaterThan(0);
  });
});

describe('isOpenedToday / markOpenedToday', () => {
  it('false до открытия, true в тот же день после markOpenedToday, снова false на следующий день', () => {
    const storage = fakeStorage();
    const today = new Date('2026-03-01T09:00:00');
    const tomorrow = new Date('2026-03-02T09:00:00');

    expect(isOpenedToday(today, storage)).toBe(false);
    markOpenedToday(today, storage);
    expect(isOpenedToday(today, storage)).toBe(true);
    expect(isOpenedToday(tomorrow, storage)).toBe(false);
  });
});

describe('getDayNumberForDateKey', () => {
  it('null для даты раньше anchor, число — для anchor и позже', () => {
    const anchor = '2026-03-05';
    expect(getDayNumberForDateKey(anchor, '2026-03-04')).toBeNull();
    expect(getDayNumberForDateKey(anchor, '2026-03-05')).toBe(1);
    expect(getDayNumberForDateKey(anchor, '2026-03-06')).toBe(2);
  });
});

describe('getCardRange', () => {
  it('в день первого визита прошлые дни недоступны (dayNumber/card = null)', () => {
    const storage = fakeStorage();
    const result = getCardRange(
      new Date('2026-03-05T09:00:00'),
      { daysBack: 7, daysForward: 1 },
      storage,
    );
    expect(result).toHaveLength(9);
    const past = result.filter((d) => d.offset < 0);
    expect(past.every((d) => d.dayNumber === null && d.card === null)).toBe(true);
    const today = result.find((d) => d.offset === 0);
    expect(today?.dayNumber).toBe(1);
    const tomorrow = result.find((d) => d.offset === 1);
    expect(tomorrow?.dayNumber).toBe(2);
  });

  it('после недели использования доступны все 7 дней назад последовательными day-номерами', () => {
    const storage = fakeStorage();
    getOrCreateAnchorDateKey(new Date('2026-03-01T09:00:00'), storage);
    const result = getCardRange(
      new Date('2026-03-10T09:00:00'),
      { daysBack: 7, daysForward: 1 },
      storage,
    );
    const byOffset = new Map(result.map((d) => [d.offset, d]));
    expect(byOffset.get(-7)?.dayNumber).toBe(3);
    expect(byOffset.get(-1)?.dayNumber).toBe(9);
    expect(byOffset.get(0)?.dayNumber).toBe(10);
    expect(byOffset.get(1)?.dayNumber).toBe(11);
  });
});

describe('getNextMidnight', () => {
  it('возвращает timestamp ближайшей местной полуночи', () => {
    const now = new Date('2026-03-05T18:30:00');
    const next = new Date(getNextMidnight(now));
    expect(next.getDate()).toBe(6);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
  });
});

describe('isCardOpened / markCardOpened', () => {
  it('отслеживает несколько дат независимо', () => {
    const storage = fakeStorage();
    expect(isCardOpened('2026-03-01', storage)).toBe(false);
    markCardOpened('2026-03-01', storage);
    expect(isCardOpened('2026-03-01', storage)).toBe(true);
    expect(isCardOpened('2026-03-02', storage)).toBe(false);
    markCardOpened('2026-03-02', storage);
    expect(isCardOpened('2026-03-01', storage)).toBe(true);
    expect(isCardOpened('2026-03-02', storage)).toBe(true);
  });

  it('подхватывает легаси-ключ одиночной даты, если новый ещё не писался', () => {
    const storage = fakeStorage();
    storage.setItem('moodly_daily_card_opened_date', '2026-03-01');
    expect(isCardOpened('2026-03-01', storage)).toBe(true);
    expect(isOpenedToday(new Date('2026-03-01T12:00:00'), storage)).toBe(true);
  });
});

describe('избранное', () => {
  it('toggleFavorite добавляет и убирает по dayNumber, порядок — новые сверху', () => {
    const storage = fakeStorage();
    expect(getFavorites(storage)).toEqual([]);

    toggleFavorite({ dayNumber: 1, principle: 'autonomy', text: 'A' }, storage);
    toggleFavorite({ dayNumber: 2, principle: 'competence', text: 'B' }, storage);
    const favorites = getFavorites(storage);
    expect(favorites.map((f) => f.dayNumber)).toEqual([2, 1]);
    expect(isFavorite(1, storage)).toBe(true);
    expect(isFavorite(3, storage)).toBe(false);

    toggleFavorite({ dayNumber: 1, principle: 'autonomy', text: 'A' }, storage);
    expect(isFavorite(1, storage)).toBe(false);
    expect(getFavorites(storage).map((f) => f.dayNumber)).toEqual([2]);
  });

  it('removeFavorite убирает конкретную запись', () => {
    const storage = fakeStorage();
    toggleFavorite({ dayNumber: 5, principle: 'relatedness', text: 'C' }, storage);
    removeFavorite(5, storage);
    expect(getFavorites(storage)).toEqual([]);
  });
});
