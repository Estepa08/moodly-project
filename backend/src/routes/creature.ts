import type { FastifyInstance } from "fastify";
import { creatureService } from "../services/creature.js";

interface ExerciseCompleteBody {
  duration: number;
}

interface RewardBody {
  source: string;
}

interface CompletionsQuery {
  days?: string;
}

export default async function creatureRoutes(fastify: FastifyInstance) {
  fastify.get("/creature", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getState(request.userId);
  });

  fastify.post(
    "/creature/check-in",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.checkIn(request.userId);
    },
  );

  fastify.post<{ Body: ExerciseCompleteBody }>(
    "/creature/exercise/complete",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.completeExercise(request.userId, request.body.duration);
    },
  );

  fastify.post<{ Body: RewardBody }>(
    "/creature/reward",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.rewardPractice(request.userId, request.body.source);
    },
  );

  fastify.get<{ Querystring: CompletionsQuery }>(
    "/creature/completions",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const days = request.query.days ? parseInt(request.query.days, 10) : 30;
      return creatureService.getCompletions(request.userId, days);
    },
  );
}
