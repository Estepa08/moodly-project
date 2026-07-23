import { prisma } from "../lib/prisma.js";

interface Recommendation {
  practiceId: string;
  practiceType: string;
  title: string;
  icon: string;
  route: string;
  message: string;
}

export const recommendationService = {
  async getForUser(userId: string): Promise<Recommendation | null> {
    const practices = await prisma.practice.findMany({ orderBy: { order: "asc" } });
    if (practices.length === 0) return null;

    // Always recommend breathing if there are no entries yet
    const breathing = practices.find((p) => p.type === "breathing");
    if (!breathing) return null;

    // Get the most recent numeric entry
    const lastEntry = await prisma.entry.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { parameter: true },
    });

    if (!lastEntry || !lastEntry.parameter) {
      return {
        practiceId: breathing.id,
        practiceType: breathing.type,
        title: breathing.title,
        icon: breathing.icon,
        route: breathing.route,
        message: "recommendation.welcomeBreathing",
      };
    }

    const paramName = lastEntry.parameter.name;
    const value = lastEntry.value;

    // Rule table: parameter + value range → practice type
    const rules: { param: string; min: number; max: number; practiceType: string; messageKey: string }[] = [
      { param: "Anxiety", min: 7, max: 10, practiceType: "breathing", messageKey: "recommendation.highAnxiety" },
      { param: "Mood", min: 0, max: 3, practiceType: "gratitude", messageKey: "recommendation.lowMood" },
      { param: "Sleep", min: 0, max: 4, practiceType: "sleep-hygiene", messageKey: "recommendation.poorSleep" },
      { param: "Energy", min: 0, max: 3, practiceType: "breathing", messageKey: "recommendation.lowEnergy" },
    ];

    // Check rules against the last entry
    for (const rule of rules) {
      if (paramName === rule.param && value >= rule.min && value <= rule.max) {
        const practice = practices.find((p) => p.type === rule.practiceType);
        if (practice) {
          return {
            practiceId: practice.id,
            practiceType: practice.type,
            title: practice.title,
            icon: practice.icon,
            route: practice.route,
            message: rule.messageKey,
          };
        }
      }
    }

    // Also check latest TestResult for clinical scores
    const lastTestResult = await prisma.testResult.findFirst({
      where: { userId },
      orderBy: { completedAt: "desc" },
      include: { test: true },
    });

    if (lastTestResult) {
      const testTitle = lastTestResult.test?.title ?? "";
      if (
        (testTitle === "GAD-7" && lastTestResult.score >= 10) ||
        (testTitle === "Burns Anxiety Inventory" && lastTestResult.score >= 30)
      ) {
        const practice = practices.find((p) => p.type === "breathing");
        if (practice) {
          return {
            practiceId: practice.id,
            practiceType: practice.type,
            title: practice.title,
            icon: practice.icon,
            route: practice.route,
            message: "recommendation.anxietyFromTest",
          };
        }
      }
      if (
        (testTitle === "PHQ-9" && lastTestResult.score >= 10) ||
        (testTitle === "Burns Depression Checklist" && lastTestResult.score >= 30)
      ) {
        const practice = practices.find((p) => p.type === "gratitude");
        if (practice) {
          return {
            practiceId: practice.id,
            practiceType: practice.type,
            title: practice.title,
            icon: practice.icon,
            route: practice.route,
            message: "recommendation.lowMoodFromTest",
          };
        }
      }
    }

    // Fallback: alternate between breathing and the first practice
    return {
      practiceId: breathing.id,
      practiceType: breathing.type,
      title: breathing.title,
      icon: breathing.icon,
      route: breathing.route,
      message: "recommendation.defaultBreathing",
    };
  },

  async recordAction(userId: string, practiceId: string, action: "shown" | "taken" | "dismissed") {
    await prisma.feedback.create({
      data: {
        userId,
        message: `[recommendation] practiceId=${practiceId} action=${action}`,
      },
    });
  },
};
