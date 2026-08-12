import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { AppError, NotFoundError } from '../lib/errors.js';
import { feedbackService } from '../services/feedback.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get('/admin/users', { preHandler: [fastify.requireAdmin] }, async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        ageConfirmed: true,
        _count: {
          select: {
            entries: true,
            testResults: true,
            breathingSessions: true,
            cbaEntries: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      emailVerified: u.emailVerified,
      ageConfirmed: u.ageConfirmed,
      entriesCount: u._count.entries,
      testResultsCount: u._count.testResults,
      breathingSessionsCount: u._count.breathingSessions,
      cbaEntriesCount: u._count.cbaEntries,
    }));
  });

  fastify.get('/admin/feedback', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { skip, take } = request.query as { skip?: string; take?: string };
    const result = await feedbackService.listAll(
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined,
    );
    reply.header('X-Total-Count', result.total);
    return result.data.map(({ userId: _userId, ...feedback }) => feedback);
  });

  fastify.delete<{ Params: { id: string } }>(
    '/admin/users/:id',
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      if (request.params.id === request.userId) {
        throw new AppError('CANNOT_DELETE_SELF', 400, 'Cannot delete your own account');
      }

      const user = await prisma.user.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });
      if (!user) throw new NotFoundError('User');

      await prisma.user.delete({ where: { id: request.params.id } });
      reply.status(204);
    },
  );
}
