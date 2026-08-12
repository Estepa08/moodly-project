import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { shouldAutoOpenCheckIn, markCheckInDone } from '../PetCheckInDialog';
import { ParameterName } from '../../../lib/constants';

const sleepId = 'param-sleep';
const moodId = 'param-mood';
const paramIdByName = new Map<string, string>([
  [ParameterName.Sleep, sleepId],
  [ParameterName.Mood, moodId],
]);

function savedToday(ids: string[]): Set<string> {
  return new Set(ids);
}

function todayKey(phase: 'morning' | 'day' | 'evening') {
  const today = new Date().toISOString().slice(0, 10);
  return `moodly_pet_checkin_${phase}_${today}`;
}

describe('shouldAutoOpenCheckIn', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('не открывает модалку, если Sleep за сегодня уже сохранён (утро 8:00)', () => {
    vi.setSystemTime(new Date('2026-08-06T08:00:00'));
    const result = shouldAutoOpenCheckIn(savedToday([sleepId]), paramIdByName);
    expect(result).toBe(false);
  });

  it('открывает модалку, если Sleep не отмечен, даже если Mood уже сохранён (утро 8:00)', () => {
    vi.setSystemTime(new Date('2026-08-06T08:00:00'));
    const result = shouldAutoOpenCheckIn(savedToday([moodId]), paramIdByName);
    expect(result).toBe(true);
  });

  it('открывает модалку, если Sleep ещё не отмечен и localStorage пуст', () => {
    vi.setSystemTime(new Date('2026-08-06T08:00:00'));
    const result = shouldAutoOpenCheckIn(savedToday([]), paramIdByName);
    expect(result).toBe(true);
  });

  it('не открывает второй раз в той же фазе после markCheckInDone', () => {
    vi.setSystemTime(new Date('2026-08-06T08:00:00'));
    markCheckInDone();
    const result = shouldAutoOpenCheckIn(savedToday([]), paramIdByName);
    expect(result).toBe(false);
  });

  it('открывает снова на следующий день в той же фазе', () => {
    vi.setSystemTime(new Date('2026-08-06T08:00:00'));
    markCheckInDone();

    vi.setSystemTime(new Date('2026-08-07T08:00:00'));
    const result = shouldAutoOpenCheckIn(savedToday([]), paramIdByName);
    expect(result).toBe(true);
  });

  it('использует отдельный ключ для фазы day (18:00)', () => {
    vi.setSystemTime(new Date('2026-08-06T18:00:00'));
    localStorage.setItem(todayKey('day'), '1');
    const result = shouldAutoOpenCheckIn(savedToday([]), paramIdByName);
    expect(result).toBe(false);
  });
});
