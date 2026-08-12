import type { FastifyInstance } from "fastify";
import { emotionLabService, DailyLimitError } from "../services/emotion-lab.js";

interface AttemptBody {
  emotionA?: string;
  emotionB?: string;
}

export default async function emotionLabRoutes(fastify: FastifyInstance) {
  fastify.get("/emotion-lab/state", { preHandler: [fastify.authenticate] }, async (request) => {
    return emotionLabService.getState(request.userId);
  });

  fastify.post<{ Body: AttemptBody }>(
    "/emotion-lab/attempt",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        return await emotionLabService.attempt(
          request.userId,
          request.body?.emotionA,
          request.body?.emotionB,
        );
      } catch (e) {
        if (e instanceof DailyLimitError) {
          return reply.status(403).send({
            error: "daily_limit_reached",
            limit: e.limit,
            tier: e.tier,
            resetsAt: e.resetsAt.toISOString(),
          });
        }
        throw e;
      }
    },
  );
}
