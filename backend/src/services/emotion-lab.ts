import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { lockUser } from "../lib/user-lock.js";
import { getDailyLimit, getEffectiveTier, type EntitlementUser } from "../entitlements.js";
import {
  DYADS,
  findDyadByEmotions,
  dyadKeysByLevel,
  type DyadInfo,
  type DyadLevel,
} from "@moodly/shared";

export const EMOTION_LAB_FEATURE = "emotion_lab_attempts";

const LEVEL_LOCK_MESSAGES: Partial<Record<DyadLevel, string>> = {
  2: "Unlock all 8 primary dyads first",
  3: "Unlock all 8 secondary dyads first",
  4: "Unlock both prerequisite primary dyads first",
};

// Начало следующего дня по серверному времени (момент сброса лимита попыток).
function nextDayStart(now = new Date()): Date {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return new Date(today.getTime() + 24 * 60 * 60 * 1000);
}

function sameDay(a: Date, b: Date): boolean {
  const da = new Date(a);
  da.setHours(0, 0, 0, 0);
  const db = new Date(b);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
}

function allDiscovered(keys: string[], discovered: Set<string>): boolean {
  return keys.every((k) => discovered.has(k));
}

// Текущий доступный уровень (1-4): уровень N доступен, когда открыты ВСЕ диады
// уровня N-1. Противоположности (уровень 4) разблокируются индивидуально —
// это проверяется отдельно в isDyadUnlocked.
function computeAvailableLevel(discovered: Set<string>): DyadLevel {
  if (allDiscovered(dyadKeysByLevel(1), discovered)) {
    if (allDiscovered(dyadKeysByLevel(2), discovered)) {
      if (allDiscovered(dyadKeysByLevel(3), discovered)) return 4;
      return 3;
    }
    return 2;
  }
  return 1;
}

// Доступна ли конкретная диада: уровень 1 — всегда; уровень 2/3 — когда открыты
// все диады предыдущего уровня; уровень 4 — когда открыты обе диады-предусловия.
export function isDyadUnlocked(dyad: DyadInfo, discovered: Set<string>): boolean {
  if (dyad.level === 1) return true;
  if (dyad.level === 2) return allDiscovered(dyadKeysByLevel(1), discovered);
  if (dyad.level === 3) return allDiscovered(dyadKeysByLevel(2), discovered);
  if (dyad.level === 4) {
    return (dyad.requiresDyads ?? []).every((k) => discovered.has(k));
  }
  return false;
}

// Счётчик попыток «за сегодня»: повторяет ленивый дневной сброс CreatureState —
// если последняя попытка была в прошлом календарном дне, счётчик считается нулевым.
function attemptsUsedToday(progress: {
  dailyAttemptsUsed: number;
  lastAttemptDate: Date | null;
}): number {
  if (!progress.lastAttemptDate) return 0;
  if (!sameDay(progress.lastAttemptDate, new Date())) return 0;
  return progress.dailyAttemptsUsed;
}

function attemptsSummary(
  user: EntitlementUser,
  progress: { dailyAttemptsUsed: number; lastAttemptDate: Date | null },
  now = new Date(),
) {
  const used = attemptsUsedToday(progress);
  const limit = getDailyLimit(EMOTION_LAB_FEATURE, user);
  const resetsAt = nextDayStart(now);
  return {
    tier: getEffectiveTier(user),
    dailyLimit: limit,
    attemptsUsed: used,
    attemptsRemaining: Math.max(0, limit - used),
    resetsAt: resetsAt.toISOString(),
    limitReached: used >= limit,
  };
}

export const emotionLabService = {
  async getState(userId: string) {
    const [user, progress] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, subscriptionExpiresAt: true },
      }),
      prisma.emotionLabProgress.findUnique({ where: { userId } }),
    ]);
    if (!user) throw new AppError("NOT_FOUND", 404, "User not found");

    const discovered = new Set(progress?.discoveredDyads ?? []);
    const summary = attemptsSummary(
      user,
      progress ?? { dailyAttemptsUsed: 0, lastAttemptDate: null },
    );

    return {
      ...summary,
      discoveredDyads: progress?.discoveredDyads ?? [],
      discoveredCount: discovered.size,
      totalDyads: DYADS.length,
      availableLevel: computeAvailableLevel(discovered),
    };
  },

  async attempt(userId: string, emotionA: string | undefined, emotionB: string | undefined) {
    if (typeof emotionA !== "string" || typeof emotionB !== "string") {
      throw new AppError("VALIDATION_ERROR", 400, "emotionA and emotionB are required");
    }
    const dyad = findDyadByEmotions(emotionA, emotionB);
    if (!dyad) {
      throw new AppError(
        "INVALID_COMBINATION",
        400,
        `Unknown emotion pair: ${emotionA} + ${emotionB}`,
      );
    }

    // Проверка лимита, проверка разблокировки и инкремент — атомарно под
    // блокировкой User: параллельные попытки не превысят дневной лимит.
    return prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, subscriptionExpiresAt: true },
      });
      if (!user) throw new AppError("NOT_FOUND", 404, "User not found");

      let progress = await tx.emotionLabProgress.findUnique({ where: { userId } });
      if (!progress) {
        progress = await tx.emotionLabProgress.create({ data: { userId } });
      }

      const summary = attemptsSummary(user, progress);
      if (summary.limitReached) {
        throw new DailyLimitError(summary.dailyLimit, summary.tier, new Date(summary.resetsAt));
      }

      const discovered = new Set(progress.discoveredDyads);
      if (!isDyadUnlocked(dyad, discovered)) {
        const message = LEVEL_LOCK_MESSAGES[dyad.level] ?? "Dyad not unlocked yet";
        throw new AppError("LEVEL_LOCKED", 403, message);
      }

      const alreadyDiscovered = discovered.has(dyad.key);
      const nextDiscovered = alreadyDiscovered
        ? progress.discoveredDyads
        : [...progress.discoveredDyads, dyad.key];

      const updated = await tx.emotionLabProgress.update({
        where: { userId },
        data: {
          // Явное значение вместо increment: при новом дне старый счётчик
          // обнуляется (ленивый сброс), а инкремент взял бы устаревшее число.
          dailyAttemptsUsed: summary.attemptsUsed + 1,
          lastAttemptDate: new Date(),
          discoveredDyads: nextDiscovered,
        },
      });

      const updatedSet = new Set(updated.discoveredDyads);
      return {
        dyad: {
          key: dyad.key,
          name: dyad.name,
          level: dyad.level,
          emotions: dyad.emotions,
        },
        isNewDiscovery: !alreadyDiscovered,
        discoveredDyads: updated.discoveredDyads,
        discoveredCount: updatedSet.size,
        totalDyads: DYADS.length,
        availableLevel: computeAvailableLevel(updatedSet),
        dailyLimit: summary.dailyLimit,
        attemptsUsed: summary.attemptsUsed + 1,
        attemptsRemaining: Math.max(0, summary.dailyLimit - (summary.attemptsUsed + 1)),
        resetsAt: summary.resetsAt,
        tier: summary.tier,
        limitReached: summary.attemptsUsed + 1 >= summary.dailyLimit,
      };
    });
  },
};

// Ошибка исчерпания дневного лимита с данными для ответа
// { error: "daily_limit_reached", limit, tier, resetsAt }.
export class DailyLimitError extends Error {
  constructor(
    public limit: number,
    public tier: string,
    public resetsAt: Date,
  ) {
    super("Daily attempt limit reached");
    this.name = "DailyLimitError";
  }
}
