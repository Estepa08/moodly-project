import type { FastifyInstance } from 'fastify';
import { creatureService } from '../services/creature.js';

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

interface PetTapBody {
  empathy?: boolean;
}

interface ClaimMissionParams {
  id: string;
}

export default async function creatureRoutes(fastify: FastifyInstance) {
  fastify.get('/creature', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getState(request.userId);
  });

  fastify.post('/creature/check-in', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.checkIn(request.userId);
  });

  fastify.post<{ Body: ExerciseCompleteBody }>(
    '/creature/exercise/complete',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.completeExercise(request.userId, request.body.duration);
    },
  );

  fastify.post<{ Body: RewardBody }>(
    '/creature/reward',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.rewardPractice(request.userId, request.body.source);
    },
  );

  fastify.post('/creature/feed', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.feed(request.userId);
  });

  fastify.post<{ Body: PetTapBody }>(
    '/creature/pet',
    {
      preHandler: [fastify.authenticate],
      // Тап по компаньону — быстрая, "тактильная" реакция (см. PetAvatar), без
      // клиентского debounce: пользователь может настукать много запросов за
      // секунды. Экономику (XP/энергию) всё равно ограничивает дневной кап
      // PET_DAILY_CLICK_LIMIT в creatureService.pet(), так что здесь достаточно
      // держать лимит выше общего write-лимита, а не резать сам тап по 429.
      config: {
        rateLimit: { max: 300, timeWindow: '1 minute' },
      },
    },
    async (request) => {
      return creatureService.pet(request.userId, request.body?.empathy === true);
    },
  );

  fastify.post('/creature/play', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.play(request.userId);
  });

  fastify.get('/creature/weekly', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getWeekly(request.userId);
  });

  fastify.post(
    '/creature/weekly/claim',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.claimWeekly(request.userId);
    },
  );

  fastify.post(
    '/creature/adventure/claim',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.claimAdventureReturn(request.userId);
    },
  );

  fastify.get<{ Querystring: CompletionsQuery }>(
    '/creature/completions',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const days = request.query.days ? parseInt(request.query.days, 10) : 30;
      return creatureService.getCompletions(request.userId, days);
    },
  );

  fastify.get('/creature/stats', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getStats(request.userId);
  });

  fastify.get('/creature/pets', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getPets(request.userId);
  });

  fastify.patch<{ Body: PetBody }>(
    '/creature/pet',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.setPet(request.userId, request.body.petType, request.body.petName);
    },
  );

  fastify.get<{ Querystring: HeatmapQuery }>(
    '/creature/heatmap',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const days = request.query.days ? parseInt(request.query.days, 10) : 90;
      return creatureService.getHeatmap(request.userId, days);
    },
  );

  fastify.get('/creature/missions', { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getMissions(request.userId);
  });

  fastify.post<{ Params: ClaimMissionParams }>(
    '/creature/missions/:id/claim',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return creatureService.claimMission(request.userId, request.params.id);
    },
  );
}
