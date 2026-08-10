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

interface HeatmapQuery {
  days?: string;
}

interface PetBody {
  petType?: string;
  petName?: string | null;
}

interface ClaimMissionParams {
  id: string;
}

export default async function creatureRoutes(fastify: FastifyInstance) {
  fastify.get("/creature", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getState(request.userId);
  });

  fastify.post("/creature/check-in", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.checkIn(request.userId);
  });

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

  fastify.post("/creature/feed", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.feed(request.userId);
  });

  fastify.post("/creature/pet", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.pet(request.userId);
  });

  fastify.get<{ Querystring: CompletionsQuery }>(
    "/creature/completions",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const days = request.query.days ? parseInt(request.query.days, 10) : 30;
      return creatureService.getCompletions(request.userId, days);
    },
  );

  fastify.get("/creature/stats", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getStats(request.userId);
  });

  fastify.get("/creature/pets", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getPets(request.userId);
  });

  fastify.patch<{ Body: PetBody }>(
    "/creature/pet",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.setPet(request.userId, request.body.petType, request.body.petName);
    },
  );

  fastify.get<{ Querystring: HeatmapQuery }>(
    "/creature/heatmap",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const days = request.query.days ? parseInt(request.query.days, 10) : 90;
      return creatureService.getHeatmap(request.userId, days);
    },
  );

  fastify.get("/creature/missions", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getMissions(request.userId);
  });

  fastify.post<{ Params: ClaimMissionParams }>(
    "/creature/missions/:id/claim",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        return await creatureService.claimMission(request.userId, request.params.id);
      } catch (e) {
        if (e instanceof Error) {
          return reply.status(400).send({ error: e.message });
        }
        throw e;
      }
    },
  );
}
