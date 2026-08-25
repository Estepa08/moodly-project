import type { FastifyInstance } from 'fastify';
import { testService } from '../services/test.js';
import { parsePagination, sendPaginated } from '../lib/pagination.js';

export default async function testResultRoutes(fastify: FastifyInstance) {
  fastify.get('/test-results', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { testId, ...pagination } = request.query as {
      testId?: string;
      skip?: string;
      take?: string;
    };
    const { skip, take } = parsePagination(pagination);
    const result = await testService.listResults(request.userId, testId, skip, take);
    return sendPaginated(reply, result);
  });

  fastify.get<{ Params: { id: string } }>(
    '/test-results/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return testService.getResultById(request.params.id, request.userId);
    },
  );
}
