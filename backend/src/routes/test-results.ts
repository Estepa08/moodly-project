import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export default async function testResultRoutes(fastify: FastifyInstance) {
  fastify.get("/test-results", { preHandler: [fastify.authenticate] }, async (request) => {
    const { testId } = request.query as { testId?: string };
    const where: Record<string, unknown> = { userId: request.userId };
    if (testId) where.testId = testId;
    return prisma.testResult.findMany({ where, orderBy: { completedAt: "desc" } });
  });

  fastify.get<{ Params: { id: string } }>("/test-results/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    return prisma.testResult.findFirstOrThrow({
      where: { id: request.params.id, userId: request.userId },
    });
  });
}
