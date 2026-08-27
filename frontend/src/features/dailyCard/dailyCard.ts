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
// Легаси-ключ старой (одиночной) схемы «открыта ли карточка сегодня» — до
// введения карточек «вчера/завтра» хранилась только одна дата. Читаем его
// как fallback, чтобы у существующих пользователей уже открытая сегодня
// карточка не показала анимацию открытия заново.
const LEGACY_OPENED_KEY = 'moodly_daily_card_opened_date';
const OPENED_DATES_KEY = 'moodly_daily_card_opened_dates';
const MAX_TRACKED_OPENED_DATES = 60;

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return toDateKey(d);
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

// 1..365, циклически, для произвольной даты относительно anchor'а. null —
// дата раньше anchor'а (напр. «вчера» для пользователя, который зашёл впервые
// только сегодня) — там ещё нет персональной истории.
export function getDayNumberForDateKey(anchorDateKey: string, dateKey: string): number | null {
  const diff = daysBetween(anchorDateKey, dateKey);
  if (diff < 0) return null;
  return (diff % SCHEDULE.length) + 1;
}

// 1..365, циклически. day 1 = день anchor'а.
export function getDayNumber(anchorDateKey: string, now: Date): number {
  return getDayNumberForDateKey(anchorDateKey, toDateKey(now)) ?? 1;
}

export function getCardForDayNumber(dayNumber: number): MotivationCardEntry {
  return SCHEDULE.find((entry) => entry.day === dayNumber) ?? SCHEDULE[0];
}

export function getTodayCard(
  now: Date,
  storage: SafeStorage = safeLocalStorage,
): MotivationCardEntry {
  const anchor = getOrCreateAnchorDateKey(now, storage);
  return getCardForDayNumber(getDayNumber(anchor, now));
}

export interface DayCardInfo {
  dateKey: string;
  /** Смещение в календарных днях от сегодня: отрицательное — прошлое, 0 — сегодня, положительное — будущее. */
  offset: number;
  dayNumber: number | null;
  card: MotivationCardEntry | null;
}

export interface CardRangeOptions {
  daysBack: number;
  daysForward: number;
}

// Данные для ленты карточек вокруг персонального anchor'а пользователя —
// от `daysBack` дней назад до `daysForward` дней вперёд (сегодня — offset 0).
// Прошлые дни раньше anchor'а (пользователь тогда ещё не пользовался
// приложением) возвращаются с dayNumber/card = null — там ещё нет личной
// истории. Будущие дни всегда есть (расписание циклично), но открывать их
// нельзя, пока не наступят — см. getNextMidnight.
export function getCardRange(
  now: Date,
  { daysBack, daysForward }: CardRangeOptions,
  storage: SafeStorage = safeLocalStorage,
): DayCardInfo[] {
  const anchor = getOrCreateAnchorDateKey(now, storage);
  const todayKey = toDateKey(now);

  const result: DayCardInfo[] = [];
  for (let offset = -daysBack; offset <= daysForward; offset++) {
    const dateKey = shiftDateKey(todayKey, offset);
    const dayNumber = getDayNumberForDateKey(anchor, dateKey);
    result.push({
      dateKey,
      offset,
      dayNumber,
      card: dayNumber === null ? null : getCardForDayNumber(dayNumber),
    });
  }
  return result;
}

// Timestamp ближайшей местной полуночи — момент, когда «завтрашняя» карточка
// открывается и становится «сегодняшней».
export function getNextMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

function getOpenedDateKeys(storage: SafeStorage): string[] {
  const tracked = storage.getJSON<string[]>(OPENED_DATES_KEY);
  if (tracked) return tracked;
  const legacy = storage.getItem(LEGACY_OPENED_KEY);
  return legacy ? [legacy] : [];
}

export function isCardOpened(dateKey: string, storage: SafeStorage = safeLocalStorage): boolean {
  return getOpenedDateKeys(storage).includes(dateKey);
}

export function markCardOpened(dateKey: string, storage: SafeStorage = safeLocalStorage): void {
  const dates = getOpenedDateKeys(storage);
  if (dates.includes(dateKey)) return;
  storage.setJSON(OPENED_DATES_KEY, [...dates, dateKey].slice(-MAX_TRACKED_OPENED_DATES));
}

export function isOpenedToday(now: Date, storage: SafeStorage = safeLocalStorage): boolean {
  return isCardOpened(toDateKey(now), storage);
}

export function markOpenedToday(now: Date, storage: SafeStorage = safeLocalStorage): void {
  markCardOpened(toDateKey(now), storage);
}

// --- Избранное: сохранённые пользователем высказывания ---
// Ключ — dayNumber (1..365), а не dateKey: текст и принцип для данного
// dayNumber неизменны, а schedule циклична, так что при следующем прохождении
// круга та же цитата не задвоится в списке избранного.

const FAVORITES_KEY = 'moodly_daily_card_favorites';
const MAX_FAVORITES = 200;

export interface FavoriteCard {
  dayNumber: number;
  principle: MotivationPrinciple;
  text: string;
  savedAt: number;
}

export function getFavorites(storage: SafeStorage = safeLocalStorage): FavoriteCard[] {
  return storage.getJSON<FavoriteCard[]>(FAVORITES_KEY) ?? [];
}

export function isFavorite(dayNumber: number, storage: SafeStorage = safeLocalStorage): boolean {
  return getFavorites(storage).some((f) => f.dayNumber === dayNumber);
}

// Тоггл: если уже в избранном — убирает, иначе добавляет в начало списка.
// Возвращает новый список целиком, чтобы вызывающий хук мог сразу обновить
// своё состояние без отдельного чтения storage.
export function toggleFavorite(
  entry: Omit<FavoriteCard, 'savedAt'>,
  storage: SafeStorage = safeLocalStorage,
): FavoriteCard[] {
  const current = getFavorites(storage);
  const next = current.some((f) => f.dayNumber === entry.dayNumber)
    ? current.filter((f) => f.dayNumber !== entry.dayNumber)
    : [{ ...entry, savedAt: Date.now() }, ...current].slice(0, MAX_FAVORITES);
  storage.setJSON(FAVORITES_KEY, next);
  return next;
}

export function removeFavorite(
  dayNumber: number,
  storage: SafeStorage = safeLocalStorage,
): FavoriteCard[] {
  const next = getFavorites(storage).filter((f) => f.dayNumber !== dayNumber);
  storage.setJSON(FAVORITES_KEY, next);
  return next;
}

// --- Цветовой стиль карточки: переключаемая «кожа» виджета ---
export const CARD_THEMES = ['warm', 'calm', 'bold', 'neon'] as const;
export type CardTheme = (typeof CARD_THEMES)[number];

const THEME_KEY = 'moodly_daily_card_theme';
const DEFAULT_THEME: CardTheme = 'warm';

export function getCardTheme(storage: SafeStorage = safeLocalStorage): CardTheme {
  const stored = storage.getItem(THEME_KEY);
  return (CARD_THEMES as readonly string[]).includes(stored ?? '')
    ? (stored as CardTheme)
    : DEFAULT_THEME;
}

export function setCardTheme(theme: CardTheme, storage: SafeStorage = safeLocalStorage): void {
  storage.setItem(THEME_KEY, theme);
}
