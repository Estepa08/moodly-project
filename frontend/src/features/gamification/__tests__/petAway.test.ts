import { describe, it, expect, vi, afterEach } from 'vitest';
import { shouldPetBeAway, todayKey } from '../petAway';

describe('todayKey', () => {
  it('возвращает строку-дату', () => {
    // Локальная дата, чтобы не зависеть от часового пояса CI.
    expect(todayKey(new Date(2026, 7, 12, 15, 0, 0))).toBe('Wed Aug 12 2026');
  });
});

describe('shouldPetBeAway', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reduced-motion → питомец всегда на месте', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    expect(shouldPetBeAway(null, true)).toBe(false);
  });

  it('отлучка уже была сегодня → вторая не показывается', () => {
    const date = new Date('2026-08-12T10:00:00Z');
    expect(shouldPetBeAway(todayKey(date), false, 1, date)).toBe(false);
  });

  it('с шансом 1 при пустой истории → true', () => {
    const date = new Date('2026-08-12T10:00:00Z');
    expect(shouldPetBeAway(null, false, 1, date)).toBe(true);
  });

  it('с шансом 0 → false', () => {
    const date = new Date('2026-08-12T10:00:00Z');
    expect(shouldPetBeAway(null, false, 0, date)).toBe(false);
  });

  it('с шансом 0.5 рандом ниже порога → true', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const date = new Date('2026-08-12T10:00:00Z');
    expect(shouldPetBeAway(null, false, 0.5, date)).toBe(true);
  });

  it('с шансом 0.5 рандом выше порога → false', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8);
    const date = new Date('2026-08-12T10:00:00Z');
    expect(shouldPetBeAway(null, false, 0.5, date)).toBe(false);
  });

  it('история за вчера не блокирует сегодняшнюю отлучку', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const today = new Date('2026-08-12T10:00:00Z');
    const yesterday = todayKey(new Date('2026-08-11T10:00:00Z'));
    expect(shouldPetBeAway(yesterday, false, 0.5, today)).toBe(true);
  });
});
