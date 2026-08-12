export type DayPhase = 'morning' | 'day' | 'evening';

const MORNING_START = 5;
const DAY_START = 14;
const EVENING_START = 20;

export function getDayPhase(hour = new Date().getHours()): DayPhase {
  if (hour >= MORNING_START && hour < DAY_START) return 'morning';
  if (hour >= DAY_START && hour < EVENING_START) return 'day';
  return 'evening';
}

export function useDayPhase(): DayPhase {
  return getDayPhase();
}
