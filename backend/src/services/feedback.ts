import { prisma } from "../lib/prisma.js";

export const feedbackService = {
  async create(userId: string, message: string) {
    return prisma.feedback.create({ data: { userId, message } });
  },

  async listByUser(userId: string, skip?: number, take?: number) {
    const where = { userId };
    const [data, total] = await Promise.all([
      prisma.feedback.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: take ?? 200 }),
      prisma.feedback.count({ where }),
    ]);
    return { data, total };
  },
};
