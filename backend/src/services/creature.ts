import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";

const EXP_PER_LEVEL = 100;
const CHECKIN_EXP = 20;
const EXERCISE_EXP = 10;
const MAX_ENERGY = 100;

const PRACTICE_XP: Record<string, number> = {
  breathing: 10,
  gratitude: 5,
  sleepHygiene: 5,
  distortions: 10,
  cba: 10,
};

function applyLevelUp(state: { level: number; experience: number }, xpGain: number) {
  let { level, experience } = state;
  experience += xpGain;
  let leveledUp = false;
  const nextLevelExp = level * EXP_PER_LEVEL;
  if (experience >= nextLevelExp) {
    experience -= nextLevelExp;
    level += 1;
    leveledUp = true;
  }
  return { experience, level, leveledUp };
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
    return {
      ...state,
      energy: state.energy ?? 100,
      level: state.level ?? 1,
      experience: state.experience ?? 0,
      streak: state.streak ?? 0,
      sessionCount,
    };
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

    return {
      state: { ...updated, sessionCount },
      leveledUp,
    };
  },

  async checkIn(userId: string) {
    const state = await this.getState(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastCheckIn = state.lastCheckInAt
      ? new Date(state.lastCheckInAt)
      : null;

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
      newStreak = lastDate.getTime() === yesterday.getTime()
        ? state.streak + 1
        : 1;
    }

    const { experience, level, leveledUp } = applyLevelUp(state, CHECKIN_EXP);

    const updated = await prisma.creatureState.update({
      where: { userId },
      data: {
        energy: MAX_ENERGY,
        experience,
        level,
        streak: newStreak,
        lastCheckInAt: new Date(),
      },
    });

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    return {
      state: { ...updated, sessionCount },
      leveledUp,
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

    return completions;
  },
};
