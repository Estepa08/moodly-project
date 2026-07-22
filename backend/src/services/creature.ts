import { prisma } from "../lib/prisma.js";

export const creatureService = {
  async getState(userId: string) {
    let state = await prisma.creatureState.findUnique({ where: { userId } });
    if (!state) {
      state = await prisma.creatureState.create({
        data: { userId, calmness: 50 },
      });
    }
    const sessionCount = await prisma.breathingSession.count({ where: { userId } });
    return { ...state, sessionCount };
  },

  async completeExercise(userId: string, duration: number) {
    const state = await this.getState(userId);
    const initialCalmness = state.calmness;
    const gain = Math.min(Math.floor(duration / 6), 40);
    const finalCalmness = Math.min(100, initialCalmness + gain);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: { calmness: finalCalmness, lastExerciseAt: new Date() },
      }),
      prisma.breathingSession.create({
        data: { userId, duration, initialCalmness, finalCalmness },
      }),
    ]);

    return updated;
  },
};
