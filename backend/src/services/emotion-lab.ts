import { emotionAlchemy, findDyadByEmotions, type DyadInfo } from '@moodly/shared';

export function findDyad(emotionA: string, emotionB: string): DyadInfo | undefined {
  return findDyadByEmotions(emotionA, emotionB);
}

export function getAvailableLevel(discovered: string[]): number {
  const alchemy = emotionAlchemy as Record<string, any>;
  const allDyads = Object.values(alchemy);

  // Находим максимальный уровень
  const maxLevel = Math.max(...allDyads.map((d: any) => d.level));

  // Проверяем каждый уровень
  for (let level = 1; level <= maxLevel; level++) {
    // Получаем все диады этого уровня
    const levelDyads = allDyads.filter((d: any) => d.level === level);

    // Проверяем, все ли диады этого уровня открыты
    const allDiscovered = levelDyads.every((d: any) => discovered.includes(d.key));

    // Если не все открыты - этот уровень недоступен
    if (!allDiscovered) {
      return level;
    }
  }

  // Все уровни открыты
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
