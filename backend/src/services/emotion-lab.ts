import { emotionAlchemy, DYADS, findDyadByEmotions, type DyadInfo } from "@moodly/shared";

export function findDyad(emotionA: string, emotionB: string): DyadInfo | undefined {
  // Используем встроенную функцию из shared
  return findDyadByEmotions(emotionA, emotionB);
}

export function getAvailableLevel(discovered: string[]): number {
  const alchemy = emotionAlchemy as Record<string, any>;
  const allDyads = Object.values(alchemy);
  const maxLevel = Math.max(...allDyads.map((d: any) => d.level));

  for (let level = 1; level <= maxLevel; level++) {
    const levelDyads = allDyads.filter((d: any) => d.level === level);
    const allDiscovered = levelDyads.every((d: any) => discovered.includes(d.key));
    if (!allDiscovered) {
      return level;
    }
  }
  return maxLevel + 1;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function getNextMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.toISOString();
}
