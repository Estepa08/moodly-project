import type { FastifyInstance } from 'fastify';
import { adminService } from '../services/admin.js';
import { feedbackService } from '../services/feedback.js';
import { parsePagination, sendPaginated } from '../lib/pagination.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/users', { preHandler: [fastify.requireAdmin] }, async () => {
    return adminService.listUsers();
  });

  fastify.get('/admin/feedback', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { skip, take } = parsePagination(request.query as { skip?: string; take?: string });
    const result = await feedbackService.listAll(skip, take);
    return sendPaginated(reply, {
      total: result.total,
      data: result.data.map(({ userId: _userId, ...feedback }) => feedback),
    });
  });

  fastify.delete<{ Params: { id: string } }>(
    '/admin/users/:id',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      await adminService.deleteUser(request.params.id, request.userId);
      reply.status(204);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: { tier?: string; expiresAt?: string | null } }>(
    '/admin/users/:id/tier',
    { preHandler: [fastify.requireAdmin] },
    async (request) => {
      return adminService.updateTier(request.params.id, request.body ?? {});
    },
  );
}
