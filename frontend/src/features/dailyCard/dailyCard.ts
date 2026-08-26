import { MS_PER_DAY } from '../../lib/constants';
import { safeLocalStorage, type SafeStorage } from '../../lib/safeStorage';
import schedule from './motivationSchedule.json';

// «Карточка дня»: 365-дневное расписание фраз (день → принцип SDT/growth
// mindset → текст) циклически повторяется каждый год. Точка отсчёта —
// не календарная дата, а дата первого визита пользователя на карточку
// (anchor), чтобы прогрессия ощущалась персональной, а не общей для всех
// (вариант B из product-strategy обсуждения).

export type MotivationPrinciple =
  | 'autonomy'
  | 'competence'
  | 'relatedness'
  | 'process_praise'
  | 'effort_over_talent'
  | 'challenge_reframe';

export interface MotivationCardEntry {
  day: number;
  cycle: number;
  principle: MotivationPrinciple;
  text: string;
}

const SCHEDULE = schedule as MotivationCardEntry[];

const ANCHOR_KEY = 'moodly_daily_card_anchor';
const OPENED_KEY = 'moodly_daily_card_opened_date';

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Дни считаем по календарным суткам в локальной таймзоне пользователя, не
// по разнице timestamp'ов (та плывёт от времени суток визита и от DST).
function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// Читает anchor из storage либо создаёт его «сегодняшней» датой при первом
// обращении — с этого дня и начинается персональный отсчёт day 1.
export function getOrCreateAnchorDateKey(
  now: Date,
  storage: SafeStorage = safeLocalStorage,
): string {
  const existing = storage.getItem(ANCHOR_KEY);
  if (existing) return existing;
  const todayKey = toDateKey(now);
  storage.setItem(ANCHOR_KEY, todayKey);
  return todayKey;
}

// 1..365, циклически. day 1 = день anchor'а.
export function getDayNumber(anchorDateKey: string, now: Date): number {
  const diff = Math.max(0, daysBetween(anchorDateKey, toDateKey(now)));
  return (diff % SCHEDULE.length) + 1;
}

export function getTodayCard(
  now: Date,
  storage: SafeStorage = safeLocalStorage,
): MotivationCardEntry {
  const anchor = getOrCreateAnchorDateKey(now, storage);
  const dayNumber = getDayNumber(anchor, now);
  return SCHEDULE.find((entry) => entry.day === dayNumber) ?? SCHEDULE[0];
}

export function isOpenedToday(now: Date, storage: SafeStorage = safeLocalStorage): boolean {
  return storage.getItem(OPENED_KEY) === toDateKey(now);
}

export function markOpenedToday(now: Date, storage: SafeStorage = safeLocalStorage): void {
  storage.setItem(OPENED_KEY, toDateKey(now));
}

// Три варианта анимации открытия (шорт-лист из Card Reveal Lab: Light Bloom,
// Coin Flip 3D, Lift & Tear) чередуются по дню — детерминированно, чтобы в
// один день у пользователя не менялась анимация между визитами и чтобы её
// можно было воспроизвести в тестах.
export const REVEAL_VARIANTS = ['bloom', 'flip', 'tear'] as const;
export type RevealVariant = (typeof REVEAL_VARIANTS)[number];

export function getRevealVariant(dayNumber: number): RevealVariant {
  return REVEAL_VARIANTS[(dayNumber - 1) % REVEAL_VARIANTS.length];
}
