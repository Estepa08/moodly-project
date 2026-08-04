import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { lockUser } from "../lib/user-lock.js";
import { achievementsService } from "./achievements.js";
import {
  applyLevelUp,
  stageForLevel,
  selectDailyMissions,
  PRACTICE_XP,
  CHECKIN_EXP,
  EXERCISE_EXP,
  MAX_ENERGY,
  MOOD_ENTRY_XP,
  MOOD_ENTRY_DAILY_LIMIT,
  MOOD_PARAM_NAME,
  FEED_XP,
  FEED_XP_DAILY_LIMIT,
  STARTER_PET_TYPES,
  MS_PER_DAY,
} from "@moodly/shared";

async function computePetMood(userId: string, calmness: number): Promise<string> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);
  const entries = await prisma.entry.findMany({
    where: {
      userId,
      createdAt: { gte: since },
      parameter: { name: MOOD_PARAM_NAME },
    },
    select: { value: true },
  });
  if (entries.length === 0) {
    return calmness >= 70 ? "happy" : "calm";
  }
  const avg = entries.reduce((sum, e) => sum + e.value, 0) / entries.length;
  if (avg >= 7) return "happy";
  if (avg >= 5) return calmness >= 70 ? "happy" : "calm";
  return "support";
}

export const creatureService = {
  async getState(userId: string) {
    let state = await prisma.creatureState.findUnique({ where: { userId } });
    if (!state) {
      state = await prisma.creatureState.create({
        data: { userId, calmness: 50 },
      });
    }
    const sessionCount = await prisma.breathingSession.count({ where: { userId } });
    const energy = state.energy ?? 100;
    const level = state.level ?? 1;
    const petMood = await computePetMood(userId, state.calmness ?? 50);
    return {
      ...state,
      energy,
      level,
      experience: state.experience ?? 0,
      streak: state.streak ?? 0,
      sessionCount,
      petMood,
      stage: stageForLevel(level),
    };
  },

  async getStats(userId: string) {
    const creature = await this.getState(userId);
    const completions = await prisma.practiceCompletion.findMany({
      where: { userId },
      select: { source: true, xpAwarded: true, createdAt: true },
    });
    const practiceCompletions = completions.filter(
      (c) => c.source !== "moodEntry" && c.source !== "feed",
    );
    const totalXp = completions.reduce((sum, c) => sum + c.xpAwarded, 0);
    const totalPractices = practiceCompletions.length;
    const totalCheckins = await prisma.practiceCompletion.count({
      where: { userId, source: "checkin" },
    });
    const firstActivity =
      practiceCompletions.length > 0
        ? practiceCompletions[practiceCompletions.length - 1].createdAt
        : null;
    const daysSinceFirst = firstActivity
      ? Math.max(1, Math.floor((Date.now() - firstActivity.getTime()) / MS_PER_DAY))
      : 0;

    const sourceBreakdown: Record<string, number> = {};
    for (const c of practiceCompletions) {
      sourceBreakdown[c.source as string] = (sourceBreakdown[c.source as string] ?? 0) + 1;
    }

    return {
      totalXp: totalXp + creature.experience,
      totalEarnedXp: totalXp,
      totalPractices,
      totalCheckins,
      daysSinceFirst,
      level: creature.level,
      streak: creature.streak,
      calmness: creature.calmness,
      energy: creature.energy,
      sourceBreakdown,
      feedCount: creature.feedCount ?? 0,
      feedCounts: (creature.feedCounts as Record<string, number>) ?? {},
    };
  },

  async getPets(userId: string) {
    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    if (!creature) {
      return {
        unlockedPetTypes: ["puff"],
        activePetType: "puff",
        petName: null,
        feedCounts: {},
      };
    }
    return {
      unlockedPetTypes: creature.unlockedPetTypes ?? ["puff"],
      activePetType: creature.petType ?? "puff",
      petName: creature.petName ?? null,
      feedCounts: (creature.feedCounts as Record<string, number>) ?? {},
    };
  },

  async setPet(userId: string, petType?: string, petName?: string | null) {
    const creature = await this.getState(userId);

    if (petType === undefined && petName === undefined) {
      throw new AppError("BAD_REQUEST", 400, "petType or petName is required");
    }

    const data: Record<string, unknown> = {};
    if (petType !== undefined) {
      const unlocked = creature.unlockedPetTypes ?? ["puff"];
      if (!unlocked.includes(petType)) {
        if (STARTER_PET_TYPES.includes(petType)) {
          data.unlockedPetTypes = [...unlocked, petType];
        } else {
          throw new AppError("LOCKED", 403, "Pet type not unlocked");
        }
      }
      data.petType = petType;
    }
    if (petName !== undefined) {
      const trimmed = petName?.trim() || null;
      data.petName = trimmed;
    }

    const updated = await prisma.creatureState.update({
      where: { userId },
      data,
    });
    return {
      unlockedPetTypes: updated.unlockedPetTypes ?? ["puff"],
      activePetType: updated.petType ?? "puff",
      petName: updated.petName ?? null,
    };
  },

  async getHeatmap(userId: string, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const completions = await prisma.practiceCompletion.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const completionsByDate = new Map<string, number>();
    for (const completion of completions) {
      const dateKey = completion.createdAt.toISOString().slice(0, 10);
      completionsByDate.set(dateKey, (completionsByDate.get(dateKey) ?? 0) + 1);
    }

    const result: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(since);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      result.push({ date: key, count: completionsByDate.get(key) ?? 0 });
    }

    return result;
  },

  async getMissions(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const existingMissions = await prisma.dailyMission.findMany({
      where: {
        userId,
        date: { gte: today, lt: todayEnd },
      },
    });

    if (existingMissions.length > 0) {
      return this._evaluateMissions(userId, existingMissions);
    }

    const selected = selectDailyMissions(userId, today, 3);

    const created = await Promise.all(
      selected.map((m) =>
        prisma.dailyMission.create({
          data: {
            userId,
            date: today,
            missionKey: m.missionKey,
            labelKey: m.labelKey,
            xpReward: m.xpReward,
            sortOrder: m.sortOrder,
          },
        }),
      ),
    );

    return this._evaluateMissions(userId, created);
  },

  async _evaluateMissions(
    userId: string,
    missions: Awaited<ReturnType<typeof prisma.dailyMission.findMany>>,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayCompletions = (
      await prisma.practiceCompletion.findMany({
        where: { userId, createdAt: { gte: today, lt: todayEnd } },
        select: { source: true },
      })
    ).filter((c) => c.source !== "moodEntry" && c.source !== "feed");
    const todayEntries = await prisma.entry.count({
      where: { userId, createdAt: { gte: today, lt: todayEnd } },
    });
    const todayTests = await prisma.testResult.count({
      where: { userId, completedAt: { gte: today, lt: todayEnd } },
    });
    const creature = await prisma.creatureState.findUnique({ where: { userId } });

    const completedSources = new Set(todayCompletions.map((c) => c.source));
    const breathingCount = todayCompletions.filter((c) => c.source === "breathing").length;

    const MISSION_SOURCE: Record<string, string> = {
      checkin: "checkin",
      practice_breathing: "breathing",
      practice_gratitude: "gratitude",
      practice_sleepHygiene: "sleepHygiene",
      practice_distortions: "distortions",
      practice_cba: "cba",
      practice_thoughtJournal: "thoughtJournal",
    };

    return missions.map((m) => {
      let progress = 0;

      if (m.missionKey === "complete_3_practices") {
        progress = Math.min(3, todayCompletions.length) / 3;
      } else if (m.missionKey === "complete_5_practices") {
        progress = Math.min(5, todayCompletions.length) / 5;
      } else if (m.missionKey === "log_mood_entry") {
        progress = todayEntries > 0 ? 1 : 0;
      } else if (m.missionKey === "log_3_mood_entries") {
        progress = Math.min(3, todayEntries) / 3;
      } else if (m.missionKey === "complete_test") {
        progress = todayTests > 0 ? 1 : 0;
      } else if (m.missionKey === "breathing_2") {
        progress = Math.min(2, breathingCount) / 2;
      } else if (m.missionKey === "streak_2") {
        progress = (creature?.streak ?? 0) >= 2 ? 1 : 0;
      } else {
        const source = MISSION_SOURCE[m.missionKey];
        progress = source && completedSources.has(source) ? 1 : 0;
      }

      return {
        id: m.id,
        missionKey: m.missionKey,
        labelKey: m.labelKey,
        xpReward: m.xpReward,
        progress: Math.min(1, progress),
        claimed: m.claimed,
        sortOrder: m.sortOrder,
      };
    });
  },

  async claimMission(userId: string, missionId: string) {
    // Вся операция (проверка claimed + начисление XP) в транзакции с
    // блокировкой User: параллельный claim не даст двойного начисления.
    return prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const mission = await tx.dailyMission.findUnique({ where: { id: missionId } });
      if (!mission || mission.userId !== userId) {
        throw new AppError("NOT_FOUND", 404, "Mission not found");
      }
      if (mission.claimed) {
        throw new AppError("ALREADY_CLAIMED", 409, "Mission already claimed");
      }

      const evaluated = await this.getMissions(userId);
      const match = evaluated.find((m) => m.id === missionId);
      if (!match || match.progress < 1) {
        throw new AppError("NOT_COMPLETED", 400, "Mission not yet completed");
      }

      let state = await tx.creatureState.findUnique({ where: { userId } });
      if (!state) {
        state = await tx.creatureState.create({
          data: { userId, calmness: 50 },
        });
      }
      const { experience, level, leveledUp } = applyLevelUp(state, mission.xpReward);

      await Promise.all([
        tx.dailyMission.update({
          where: { id: missionId },
          data: { claimed: true },
        }),
        tx.creatureState.update({
          where: { userId },
          data: { experience, level },
        }),
      ]);

      return { claimed: true, xpAwarded: mission.xpReward, leveledUp };
    });
  },

  async completeExercise(userId: string, duration: number) {
    const state = await this.getState(userId);
    const initialCalmness = state.calmness;
    const gain = Math.min(Math.floor(duration / 6), 40);
    const finalCalmness = Math.min(100, initialCalmness + gain);

    const { experience, level, leveledUp } = applyLevelUp(state, EXERCISE_EXP);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: { calmness: finalCalmness, lastExerciseAt: new Date(), experience, level },
      }),
      prisma.breathingSession.create({
        data: { userId, duration, initialCalmness, finalCalmness },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source: "breathing", xpAwarded: EXERCISE_EXP },
      }),
    ]);

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...updated, sessionCount },
      leveledUp,
    };
  },

  async checkIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Чтение lastCheckInAt, расчёт streak и начисление XP — атомарно под
    // блокировкой User: два параллельных check-in не дадут двойного начисления.
    const result = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      let state = await tx.creatureState.findUnique({ where: { userId } });
      if (!state) {
        state = await tx.creatureState.create({
          data: { userId, calmness: 50 },
        });
      }

      const lastCheckIn = state.lastCheckInAt ? new Date(state.lastCheckInAt) : null;

      if (lastCheckIn) {
        const lastDate = new Date(lastCheckIn);
        lastDate.setHours(0, 0, 0, 0);
        if (lastDate.getTime() === today.getTime()) {
          throw new AppError("ALREADY_CHECKED_IN", 409, "Already checked in today");
        }
      }

      let newStreak = 1;
      if (lastCheckIn) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastDate = new Date(lastCheckIn);
        lastDate.setHours(0, 0, 0, 0);
        newStreak = lastDate.getTime() === yesterday.getTime() ? (state.streak ?? 0) + 1 : 1;
      }

      const { experience, level, leveledUp } = applyLevelUp(state, CHECKIN_EXP);

      const updated = await tx.creatureState.update({
        where: { userId },
        data: {
          energy: MAX_ENERGY,
          experience,
          level,
          streak: newStreak,
          lastCheckInAt: new Date(),
        },
      });
      await tx.practiceCompletion.create({
        data: { userId, source: "checkin", xpAwarded: CHECKIN_EXP },
      });

      return { updated, leveledUp };
    });

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...result.updated, sessionCount },
      leveledUp: result.leveledUp,
    };
  },

  async rewardPractice(userId: string, source: string) {
    const xp = PRACTICE_XP[source];
    if (xp === undefined) {
      throw new AppError("INVALID_SOURCE", 400, `Unknown practice source: ${source}`);
    }

    const state = await this.getState(userId);
    const { experience, level, leveledUp } = applyLevelUp(state, xp);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: { experience, level },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source, xpAwarded: xp },
      }),
    ]);

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...updated, sessionCount },
      leveledUp,
    };
  },

  async getCompletions(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const completions = await prisma.practiceCompletion.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { source: true, xpAwarded: true, createdAt: true },
    });

    return completions.filter((c) => c.source !== "feed");
  },

  async rewardMoodEntry(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const moodCount = await prisma.practiceCompletion.count({
      where: { userId, source: "moodEntry", createdAt: { gte: today, lt: todayEnd } },
    });
    if (moodCount >= MOOD_ENTRY_DAILY_LIMIT) return null;

    const state = await this.getState(userId);
    const { experience, level, leveledUp } = applyLevelUp(state, MOOD_ENTRY_XP);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: { experience, level },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source: "moodEntry", xpAwarded: MOOD_ENTRY_XP },
      }),
    ]);

    achievementsService.check(userId).catch(() => {});

    return { ...updated, leveledUp };
  },

  async feed(userId: string) {
    const state = await this.getState(userId);
    const petType = state.petType ?? "puff";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayFeeds = await prisma.practiceCompletion.count({
      where: { userId, source: "feed", createdAt: { gte: today, lt: todayEnd } },
    });
    const xpAwarded = todayFeeds < FEED_XP_DAILY_LIMIT ? FEED_XP : 0;

    const feedCounts = { ...((state.feedCounts as Record<string, number>) ?? {}) };
    feedCounts[petType] = (feedCounts[petType] ?? 0) + 1;

    const { experience, level, leveledUp } = applyLevelUp(state, xpAwarded);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: {
          feedCount: { increment: 1 },
          feedCounts,
          experience,
          level,
        },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source: "feed", xpAwarded },
      }),
    ]);

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...updated, sessionCount },
      leveledUp,
      xpAwarded,
      feedCount: updated.feedCount,
      feedCounts: (updated.feedCounts as Record<string, number>) ?? {},
    };
  },
};
