import type { FastifyInstance } from 'fastify';
import { entryService } from '../services/entry.js';
import { createEntrySchema, updateEntrySchema } from '../lib/validation.js';
import { AppError } from '../lib/errors.js';

interface EntryCreateBody {
  id: string;
  parameterId: string;
  encryptedData: string;
}

interface EntryUpdateBody {
  encryptedData?: string;
}

export default async function entryRoutes(fastify: FastifyInstance) {
  fastify.get('/entries', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { parameterId, from, to, skip, take } = request.query as {
      parameterId?: string;
      from?: string;
      to?: string;
      skip?: string;
      take?: string;
    };
    const result = await entryService.list({
      userId: request.userId,
      parameterId,
      from,
      to,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
    reply.header('X-Total-Count', result.total);
    return result.data;
  });

  fastify.post<{ Body: EntryCreateBody }>(
    '/entries',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const parsed = createEntrySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
      }
      return entryService.create({
        id: parsed.data.id,
        userId: request.userId,
        parameterId: parsed.data.parameterId,
        encryptedData: parsed.data.encryptedData,
      });
    },
  );

  fastify.get<{ Params: { id: string } }>(
    '/entries/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return entryService.getById(request.params.id, request.userId);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: EntryUpdateBody }>(
    '/entries/:id',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const parsed = updateEntrySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
      }
      return entryService.update(request.params.id, request.userId, parsed.data);
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/entries/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await entryService.delete(request.params.id, request.userId);
      reply.status(204);
    },
  );
}
