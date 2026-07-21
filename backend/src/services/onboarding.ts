import { prisma } from "../lib/prisma.js";

export const onboardingService = {
  async list() {
    return prisma.onboardingStory.findMany({ orderBy: { order: "asc" } });
  },
};
