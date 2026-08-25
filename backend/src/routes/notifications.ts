import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { notificationService, type PushPayload } from '../services/notification.js';
import { pushSubscribeSchema, pushUnsubscribeSchema, parseOrThrow } from '../lib/validation.js';

const sendSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().min(1).max(500).optional(),
});

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.post('/push/subscribe', { preHandler: [fastify.authenticate] }, async (request) => {
    const data = parseOrThrow(pushSubscribeSchema, request.body);
    await notificationService.subscribe(request.userId, data);
    return { ok: true };
  });

  fastify.post('/push/unsubscribe', { preHandler: [fastify.authenticate] }, async (request) => {
    const data = parseOrThrow(pushUnsubscribeSchema, request.body);
    await notificationService.unsubscribe(request.userId, data.endpoint);
    return { ok: true };
  });

  fastify.post<{ Body: PushPayload }>(
    '/push/send',
    { preHandler: [fastify.requireAdmin] },
    async (request) => {
      const data = parseOrThrow(sendSchema, request.body);
      const sent = await notificationService.sendToAll(data);
      return { ok: true, sent };
    },
  );
}
