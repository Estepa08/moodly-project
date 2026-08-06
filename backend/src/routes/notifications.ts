import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { notificationService, type PushPayload } from "../services/notification.js";
import { ValidationError } from "../lib/errors.js";

interface SubscribeBody {
  endpoint: string;
  keys: Record<string, string>;
}

interface UnsubscribeBody {
  endpoint: string;
}

const sendSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().min(1).max(500).optional(),
});

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: SubscribeBody }>(
    "/push/subscribe",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { endpoint, keys } = request.body;
      await notificationService.subscribe(request.userId, { endpoint, keys });
      return { ok: true };
    },
  );

  fastify.post<{ Body: UnsubscribeBody }>(
    "/push/unsubscribe",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { endpoint } = request.body;
      await notificationService.unsubscribe(request.userId, endpoint);
      return { ok: true };
    },
  );

  fastify.post<{ Body: PushPayload }>(
    "/push/send",
    { preHandler: [fastify.requireAdmin] },
    async (request) => {
      const parsed = sendSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues[0]?.message ?? "INVALID_PAYLOAD");
      }
      const sent = await notificationService.sendToAll(parsed.data);
      return { ok: true, sent };
    },
  );
}
