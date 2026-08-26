import type { FastifyInstance } from 'fastify';
import { decatastrophizingService } from '../services/decatastrophizing.js';

interface DecatastrophizingEntryCreateBody {
  worstCaseText: string;
  copingPlanText: string;
  mostLikelyText: string;
}

export default async function decatastrophizingRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: DecatastrophizingEntryCreateBody }>(
    '/decatastrophizing/entries',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return decatastrophizingService.createEntry({
        userId: request.userId,
        worstCaseText: request.body.worstCaseText,
        copingPlanText: request.body.copingPlanText,
        mostLikelyText: request.body.mostLikelyText,
      });
    },
  );

  fastify.get(
    '/decatastrophizing/entries',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return decatastrophizingService.listEntries(request.userId);
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/decatastrophizing/entries/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await decatastrophizingService.deleteEntry(request.params.id, request.userId);
      reply.status(204);
    },
  );
}
