import type { FastifyInstance } from "fastify";
import { recommendationService } from "../services/recommendation.js";

export default async function recommendationRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/practices/recommended",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const userId = request.userId!;
      return recommendationService.getForUser(userId);
    },
  );

  fastify.post(
    "/practices/recommended/action",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.userId!;
      const { practiceId, action } = request.body as {
        practiceId: string;
        action: "shown" | "taken" | "dismissed";
      };
      await recommendationService.recordAction(userId, practiceId, action);
      return reply.status(204).send();
    },
  );
}
