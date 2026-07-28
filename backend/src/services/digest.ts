import { prisma } from "../lib/prisma.js";

export const digestService = {
  async getWeekly(userId: string) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - diff);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const [entries, testResults, completions, creatureState] = await Promise.all([
      prisma.entry.findMany({
        where: { userId, createdAt: { gte: startDate, lte: endDate } },
        include: { parameter: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.testResult.findMany({
        where: { userId, completedAt: { gte: startDate, lte: endDate } },
        include: { test: true },
        orderBy: { completedAt: "desc" },
      }),
      prisma.practiceCompletion.findMany({
        where: { userId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.creatureState.findUnique({ where: { userId } }),
    ]);

    const numericParams = ["Mood", "Anxiety", "Sleep", "Energy"];
    const numericEntries = entries.filter((e) => numericParams.includes(e.parameter.name));
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const e of numericEntries) {
      if (!totals[e.parameter.name]) totals[e.parameter.name] = { sum: 0, count: 0 };
      totals[e.parameter.name].sum += e.value;
      totals[e.parameter.name].count += 1;
    }
    const averages: Record<string, number> = {};
    for (const [key, val] of Object.entries(totals)) {
      averages[key.toLowerCase()] = Math.round((val.sum / val.count) * 10) / 10;
    }

    const practicesCompleted: Record<string, number> = {};
    let creatureXpGained = 0;
    for (const c of completions) {
      practicesCompleted[c.source] = (practicesCompleted[c.source] || 0) + 1;
      creatureXpGained += c.xpAwarded;
    }

    const testsTaken = testResults.map((r) => ({
      testId: r.testId,
      title: r.test.title,
      score: r.score,
      interpretation: r.interpretation,
    }));

    const checkInCount = creatureState?.streak ?? 0;

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalEntries: entries.length,
      averages,
      checkInDays: checkInCount,
      testsTaken,
      practicesCompleted,
      creatureXpGained,
      creatureLevel: creatureState?.level ?? 1,
    };
  },
};
