import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';

export const testService = {
  async list() {
    return prisma.test.findMany({
      where: { active: true },
      select: { id: true, title: true, description: true, active: true },
    });
  },

  async getById(id: string) {
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        scoreBands: { orderBy: { maxScore: 'asc' } },
      },
    });
    if (!test) throw new NotFoundError('Test');
    return test;
  },

  async listResults(userId: string, testId?: string, skip?: number, take?: number) {
    const where: Record<string, unknown> = { userId };
    if (testId) where.testId = testId;
    const [data, total] = await Promise.all([
      prisma.testResult
        .findMany({
          where,
          orderBy: { completedAt: 'desc' },
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
    if (!result) throw new NotFoundError('TestResult');
    return result;
  },
};
