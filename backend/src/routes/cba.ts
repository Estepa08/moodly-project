import type { FastifyInstance } from 'fastify';
import { cbaService, type CbaEntryItemInput } from '../services/cba.js';

interface CbaEntryCreateBody {
  thoughtText: string;
  prosWeight: number;
  consWeight: number;
  items: CbaEntryItemInput[];
}

export default async function cbaRoutes(fastify: FastifyInstance) {
  fastify.get('/cba/examples', { preHandler: [fastify.authenticate] }, async () => {
    return cbaService.listExamples();
  });

  fastify.get('/cba/common-items', { preHandler: [fastify.authenticate] }, async () => {
    return cbaService.listCommonItems();
  });

  fastify.post<{ Body: CbaEntryCreateBody }>(
    '/cba/entries',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return cbaService.createEntry({
        userId: request.userId,
        thoughtText: request.body.thoughtText,
        prosWeight: request.body.prosWeight,
        consWeight: request.body.consWeight,
        items: request.body.items,
      });
    },
  );

  fastify.get('/cba/entries', { preHandler: [fastify.authenticate] }, async (request) => {
    return cbaService.listEntries(request.userId);
  });

  fastify.delete<{ Params: { id: string } }>(
    '/cba/entries/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await cbaService.deleteEntry(request.params.id, request.userId);
      reply.status(204);
    },
  );
}
