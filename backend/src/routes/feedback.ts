import type { FastifyInstance } from "fastify";
import { feedbackService } from "../services/feedback.js";

interface FeedbackCreateBody {
  message: string;
}

export default async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: FeedbackCreateBody }>("/feedback", { preHandler: [fastify.authenticate] }, async (request) => {
    return feedbackService.create(request.userId, request.body.message);
  });

  fastify.get("/feedback/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { skip, take } = request.query as { skip?: string; take?: string };
    const result = await feedbackService.listByUser(request.userId, skip ? parseInt(skip, 10) : undefined, take ? parseInt(take, 10) : undefined);
    reply.header("X-Total-Count", result.total);
    return result.data;
  });
}
