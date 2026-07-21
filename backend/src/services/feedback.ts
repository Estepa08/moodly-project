import { prisma } from "../lib/prisma.js";

export const feedbackService = {
  async create(userId: string, message: string) {
    return prisma.feedback.create({ data: { userId, message } });
  },

  async listByUser(userId: string) {
    return prisma.feedback.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  },
};
