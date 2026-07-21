import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

interface FeedbackCreateBody {
  message: string;
}

export default async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: FeedbackCreateBody }>("/feedback", { preHandler: [fastify.authenticate] }, async (request) => {
    return prisma.feedback.create({
      data: { userId: request.userId, message: request.body.message },
    });
  });

  fastify.get("/feedback/me", { preHandler: [fastify.authenticate] }, async (request) => {
    return prisma.feedback.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: "desc" },
    });
  });
}
