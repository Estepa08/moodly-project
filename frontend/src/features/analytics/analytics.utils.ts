/**
 * Является ли изменение значения улучшением, с учётом «валентности»
 * параметра: для обычных параметров рост — это хорошо (delta > 0), для
 * negative-valence параметров (тревога, искажения мышления и т.п.) хорошо,
 * наоборот, снижение (delta < 0). `delta === 0` улучшением не считается.
 */
export function isImprovement(delta: number, isNegativeValence: boolean): boolean {
  if (delta === 0) return false;
  return isNegativeValence ? delta < 0 : delta > 0;
}

/** Обратное `isImprovement` — является ли изменение ухудшением. */
export function isRegression(delta: number, isNegativeValence: boolean): boolean {
  if (delta === 0) return false;
  return isNegativeValence ? delta > 0 : delta < 0;
}
