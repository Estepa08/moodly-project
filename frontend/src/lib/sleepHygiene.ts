export enum HygieneItem {
  NoCaffeine = "noCaffeine",
  NoScreens = "noScreens",
  ConsistentBedtime = "consistentBedtime",
  DarkQuietCool = "darkQuietCool",
  NoAlcohol = "noAlcohol",
  DayActivity = "dayActivity",
  NoLateMeal = "noLateMeal",
}

export const SLEEP_HYGIENE_ITEMS = Object.values(HygieneItem);

export const SLEEP_HYGIENE_THRESHOLD = Math.ceil(SLEEP_HYGIENE_ITEMS.length / 2);

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nextDayKey(date: Date): string {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return dayKey(next);
}

export function parseCheckedNote(note: string | undefined | null): Set<HygieneItem> {
  if (!note) return new Set();
  const keys = note.split(",").filter(Boolean);
  return new Set(
    keys.filter((k): k is HygieneItem => (Object.values(HygieneItem) as string[]).includes(k)) as HygieneItem[],
  );
}

export function findTodayEntry<T extends { createdAt: string }>(
  entries: T[],
): T | undefined {
  const today = dayKey(new Date());
  return entries.find((e) => dayKey(new Date(e.createdAt)) === today);
}
