import type { FastifyInstance } from "fastify";
import { feedbackService } from "../services/feedback.js";

interface FeedbackCreateBody {
  message: string;
}

export default async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: FeedbackCreateBody }>("/feedback", { preHandler: [fastify.authenticate] }, async (request) => {
    return feedbackService.create(request.userId, request.body.message);
  });

  fastify.get("/feedback/me", { preHandler: [fastify.authenticate] }, async (request) => {
    return feedbackService.listByUser(request.userId);
  });
}
