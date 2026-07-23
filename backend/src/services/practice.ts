import { prisma } from "../lib/prisma.js";

export const practiceService = {
  async list() {
    return prisma.practice.findMany({ orderBy: { order: "asc" } });
  },
};
