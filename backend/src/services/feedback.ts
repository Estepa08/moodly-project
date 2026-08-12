import { prisma } from '../lib/prisma.js';

export const feedbackService = {
  async create(userId: string, rating: number, message: string) {
    const existing = await prisma.feedback.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (existing) {
      return prisma.feedback.update({
        where: { id: existing.id },
        data: { rating, message },
      });
    }
    return prisma.feedback.create({ data: { userId, rating, message } });
  },

  async listByUser(userId: string, skip?: number, take?: number) {
    const where = { userId };
    const [data, total] = await Promise.all([
      prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: take ?? 200 }),
      prisma.feedback.count({ where }),
    ]);
    return { data, total };
  },

  async listAll(skip?: number, take?: number) {
    const [data, total] = await Promise.all([
      prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: take ?? 200,
        include: {
          user: { select: { email: true, name: true } },
        },
      }),
      prisma.feedback.count(),
    ]);
    return { data, total };
  },
};
