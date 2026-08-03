import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { getInterpretation } from "./test-interpretations.js";
import { computeScore } from "@moodly/shared";

interface TestAnswer {
  questionId: string;
  optionId: string;
}

export const testService = {
  async list() {
    return prisma.test.findMany({
      where: { active: true },
      select: { id: true, title: true, description: true, active: true },
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
    if (!test.active) throw new NotFoundError("Test");

    const questions = test.questions as { id: string; options: { id: string; score: number }[] }[];

    const { score, maxScore } = computeScore(questions, answers);

    const { interpretation, recommendation, flags } = await getInterpretation(
      test.id,
      test.title,
      test.type,
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
      prisma.testResult
        .findMany({
          where,
          orderBy: { completedAt: "desc" },
          skip,
          take: take ?? 200,
          include: { test: { select: { title: true } } },
        })
        .then((results) => results.map((r) => ({ ...r, testTitle: r.test.title }))),
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
