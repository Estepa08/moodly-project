import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

interface UpdateMeBody {
  name?: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/users/me", { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.userId } });
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  });

  fastify.patch<{ Body: UpdateMeBody }>("/users/me", { preHandler: [fastify.authenticate] }, async (request) => {
    const { name } = request.body;
    const user = await prisma.user.update({
      where: { id: request.userId },
      data: { name },
    });
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  });

  fastify.delete("/users/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await prisma.user.delete({ where: { id: request.userId } });
    reply.status(204);
  });
}
