import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { AppError, NotFoundError } from "../lib/errors.js";

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get("/admin/users", { preHandler: [fastify.requireAdmin] }, async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
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

  fastify.delete<{ Params: { id: string } }>(
    "/admin/users/:id",
    { preHandler: [fastify.requireAdmin] },
    async (request, reply) => {
      if (request.params.id === request.userId) {
        throw new AppError("CANNOT_DELETE_SELF", 400, "Cannot delete your own account");
      }

      const user = await prisma.user.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });
      if (!user) throw new NotFoundError("User");

      await prisma.user.delete({ where: { id: request.params.id } });
      reply.status(204);
    },
  );
}
