import type { FastifyInstance } from 'fastify';
import {
  responsibilityPieService,
  type ResponsibilityFactorInput,
} from '../services/responsibility-pie.js';

interface ResponsibilityPieEntryCreateBody {
  situationText: string;
  factors: ResponsibilityFactorInput[];
}

export default async function responsibilityPieRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ResponsibilityPieEntryCreateBody }>(
    '/responsibility-pie/entries',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return responsibilityPieService.createEntry({
        userId: request.userId,
        situationText: request.body.situationText,
        factors: request.body.factors,
      });
    },
  );

  fastify.get(
    '/responsibility-pie/entries',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return responsibilityPieService.listEntries(request.userId);
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/responsibility-pie/entries/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await responsibilityPieService.deleteEntry(request.params.id, request.userId);
      reply.status(204);
    },
  );
}
