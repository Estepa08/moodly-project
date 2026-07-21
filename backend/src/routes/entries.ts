import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

interface EntryCreateBody {
  parameterId: string;
  value: number;
  note?: string;
}

interface EntryUpdateBody {
  value?: number;
  note?: string;
}

export default async function entryRoutes(fastify: FastifyInstance) {
  fastify.get("/entries", { preHandler: [fastify.authenticate] }, async (request) => {
    const { parameterId, from, to } = request.query as {
      parameterId?: string;
      from?: string;
      to?: string;
    };

    const where: Record<string, unknown> = { userId: request.userId };
    if (parameterId) where.parameterId = parameterId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    return prisma.entry.findMany({ where, orderBy: { createdAt: "desc" } });
  });

  fastify.post<{ Body: EntryCreateBody }>("/entries", { preHandler: [fastify.authenticate] }, async (request) => {
    const { parameterId, value, note } = request.body;
    return prisma.entry.create({
      data: { userId: request.userId, parameterId, value, note },
    });
  });

  fastify.get<{ Params: { id: string } }>("/entries/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    const entry = await prisma.entry.findFirstOrThrow({
      where: { id: request.params.id, userId: request.userId },
    });
    return entry;
  });

  fastify.patch<{ Params: { id: string }; Body: EntryUpdateBody }>("/entries/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    const entry = await prisma.entry.findFirstOrThrow({
      where: { id: request.params.id, userId: request.userId },
    });
    return prisma.entry.update({
      where: { id: entry.id },
      data: request.body,
    });
  });

  fastify.delete<{ Params: { id: string } }>("/entries/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await prisma.entry.deleteMany({
      where: { id: request.params.id, userId: request.userId },
    });
    reply.status(204);
  });
}
