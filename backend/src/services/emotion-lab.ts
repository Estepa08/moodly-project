import { emotionAlchemy, findDyadByEmotions, type DyadInfo } from '@moodly/shared';
import { prisma } from '../lib/prisma.js';
import { getDailyAttemptLimit } from '../entitlements.js';
import { AppError, NotFoundError, ValidationError } from '../lib/errors.js';

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

async function getDbUserForLab(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true },
  });
  if (!dbUser) throw new NotFoundError('User');
  return dbUser;
}

async function getOrCreateProgress(userId: string) {
  const progress = await prisma.emotionLabProgress.findUnique({ where: { userId } });
  if (progress) return progress;
  return prisma.emotionLabProgress.create({
    data: { userId, dailyAttemptsUsed: 0, discoveredDyads: [] },
  });
}

export interface EmotionLabState {
  tier: string;
  dailyLimit: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  resetsAt: string;
  limitReached: boolean;
  discoveredDyads: string[];
  discoveredCount: number;
  totalDyads: number;
  availableLevel: number;
}

export type AttemptResult =
  | {
      ok: true;
      dyad: DyadInfo;
      isNewDiscovery: boolean;
      discoveredDyads: string[];
      discoveredCount: number;
      totalDyads: number;
      availableLevel: number;
      dailyLimit: number;
      attemptsUsed: number;
      attemptsRemaining: number;
      resetsAt: string;
      tier: string;
      limitReached: boolean;
    }
  | { ok: false; reason: 'daily_limit_reached'; limit: number; tier: string; resetsAt: string };

export const emotionLabService = {
  async getState(userId: string): Promise<EmotionLabState> {
    const dbUser = await getDbUserForLab(userId);
    const progress = await getOrCreateProgress(userId);

    const limit = getDailyAttemptLimit(dbUser);
    const now = new Date();
    const isNewDay = !progress.lastAttemptDate || !isSameDay(progress.lastAttemptDate, now);
    const usedToday = isNewDay ? 0 : progress.dailyAttemptsUsed;
    const limitReached = usedToday >= limit;
    const discovered = progress.discoveredDyads || [];
    const availableLevel = getAvailableLevel(discovered);

    return {
      tier: dbUser.subscriptionTier,
      dailyLimit: limit,
      attemptsUsed: usedToday,
      attemptsRemaining: Math.max(0, limit - usedToday),
      resetsAt: getNextMidnight(),
      limitReached,
      discoveredDyads: discovered,
      discoveredCount: discovered.length,
      totalDyads: Object.keys(emotionAlchemy).length,
      availableLevel,
    };
  },

  async recordAttempt(userId: string, emotionA: string, emotionB: string): Promise<AttemptResult> {
    const dbUser = await getDbUserForLab(userId);
    const progress = await getOrCreateProgress(userId);

    const limit = getDailyAttemptLimit(dbUser);
    const now = new Date();
    const isNewDay = !progress.lastAttemptDate || !isSameDay(progress.lastAttemptDate, now);
    const usedToday = isNewDay ? 0 : progress.dailyAttemptsUsed;

    if (usedToday >= limit) {
      return {
        ok: false,
        reason: 'daily_limit_reached',
        limit,
        tier: dbUser.subscriptionTier,
        resetsAt: getNextMidnight(),
      };
    }

    const dyad = findDyad(emotionA, emotionB);
    if (!dyad) throw new ValidationError('Invalid emotion pair');

    const discovered = progress.discoveredDyads || [];
    const availableLevel = getAvailableLevel(discovered);
    if (dyad.level > availableLevel) {
      throw new AppError('LEVEL_LOCKED', 403, `Unlock all ${dyad.level - 1} level dyads first`);
    }

    const isNewDiscovery = !discovered.includes(dyad.key);
    const updatedDiscovered = isNewDiscovery ? [...discovered, dyad.key] : discovered;

    const updated = await prisma.emotionLabProgress.update({
      where: { userId },
      data: {
        dailyAttemptsUsed: usedToday + 1,
        lastAttemptDate: now,
        discoveredDyads: updatedDiscovered,
      },
    });

    const newLimit = getDailyAttemptLimit(dbUser);
    const newUsed = updated.dailyAttemptsUsed;
    const newAvailableLevel = getAvailableLevel(updatedDiscovered);

    return {
      ok: true,
      dyad,
      isNewDiscovery,
      discoveredDyads: updatedDiscovered,
      discoveredCount: updatedDiscovered.length,
      totalDyads: Object.keys(emotionAlchemy).length,
      availableLevel: newAvailableLevel,
      dailyLimit: newLimit,
      attemptsUsed: newUsed,
      attemptsRemaining: Math.max(0, newLimit - newUsed),
      resetsAt: getNextMidnight(),
      tier: dbUser.subscriptionTier,
      limitReached: newUsed >= newLimit,
    };
  },
};
