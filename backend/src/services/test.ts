import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { getInterpretation } from "./test-interpretations.js";

interface TestAnswer {
  questionId: string;
  optionId: string;
}

export const testService = {
  async list() {
    return prisma.test.findMany({
      select: { id: true, title: true, description: true },
    });
  },

  async getById(id: string) {
    const test = await prisma.test.findUnique({ where: { id } });
    if (!test) throw new NotFoundError("Test");
    return test;
  },

  async submitResult(testId: string, userId: string, answers: TestAnswer[]) {
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) throw new NotFoundError("Test");

    const questions = test.questions as { id: string; options: { id: string; score: number }[] }[];
    let score = 0;
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) continue;
      const option = question.options.find((o) => o.id === answer.optionId);
      if (option) score += option.score;
    }

    const maxScore = questions.reduce((sum, q) => {
      return sum + Math.max(...q.options.map((o) => o.score));
    }, 0);

    const { interpretation, recommendation, flags } = getInterpretation(
      test.title,
      score,
      maxScore,
      answers,
    );

    return prisma.testResult.create({
      data: {
        testId,
        userId,
        score,
        interpretation,
        recommendation,
        flags: flags as unknown as Prisma.InputJsonValue,
      },
    });
  },

  async listResults(userId: string, testId?: string, skip?: number, take?: number) {
    const where: Record<string, unknown> = { userId };
    if (testId) where.testId = testId;
    const [data, total] = await Promise.all([
      prisma.testResult.findMany({
        where,
        orderBy: { completedAt: "desc" },
        skip,
        take: take ?? 200,
      }),
      prisma.testResult.count({ where }),
    ]);
    return { data, total };
  },

  async getResultById(id: string, userId: string) {
    const result = await prisma.testResult.findFirst({ where: { id, userId } });
    if (!result) throw new NotFoundError("TestResult");
    return result;
  },
};
