// Логика «отлучки» компаньона на заходе в приложение.
// Компонент FloatingCompanion показывает placeholder «Отлучился перекусить 🍙»,
// по тапу питомец возвращается (pop-in + слово) и даёт обычную награду.

export const PET_AWAY_KEY = "moodly.petAwayDate";

// Шанс отлучки при заходе (не чаще раза в день).
export const PET_AWAY_CHANCE = 0.25;

export function todayKey(date = new Date()): string {
  return date.toDateString();
}

// Итоговое решение, показывать ли «отлучку»:
// - reduced-motion → питомец всегда на месте;
// - отлучка была сегодня (по localStorage) → вторая за день не показывается;
// - иначе шанс `chance`.
export function shouldPetBeAway(
  lastDate: string | null,
  reducedMotion: boolean,
  chance = PET_AWAY_CHANCE,
  date = new Date(),
): boolean {
  if (reducedMotion) return false;
  if (lastDate === todayKey(date)) return false;
  return Math.random() < chance;
}
