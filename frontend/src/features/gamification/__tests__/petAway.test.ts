import { describe, it, expect } from 'vitest';
import { adventurePhase, formatReturnTime } from '../petAway';

describe('adventurePhase', () => {
  const now = new Date('2026-08-12T15:00:00Z');

  it('нет adventureReturnAt → null (прогулки нет)', () => {
    expect(adventurePhase(null, now)).toBe(null);
    expect(adventurePhase(undefined, now)).toBe(null);
  });

  it('adventureReturnAt в будущем → active', () => {
    const future = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    expect(adventurePhase(future, now)).toBe('active');
  });

  it('adventureReturnAt в прошлом → ready', () => {
    const past = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(adventurePhase(past, now)).toBe('ready');
  });

  it('adventureReturnAt равен now → ready (граница)', () => {
    expect(adventurePhase(now.toISOString(), now)).toBe('ready');
  });

  it('невалидная дата → null', () => {
    expect(adventurePhase('not-a-date', now)).toBe(null);
  });
});

describe('formatReturnTime', () => {
  it('форматирует ISO-строку как локальное HH:MM', () => {
    const formatted = formatReturnTime('2026-08-12T18:40:00Z');
    expect(formatted).toMatch(/^\d{1,2}:\d{2}/);
  });
});
