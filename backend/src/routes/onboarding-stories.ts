import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export default async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.get("/onboarding-stories", { preHandler: [fastify.authenticate] }, async () => {
    return prisma.onboardingStory.findMany({ orderBy: { order: "asc" } });
  });
}
