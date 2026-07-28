import type { FastifyInstance } from "fastify";
import { notificationService } from "../services/notification.js";

interface SubscribeBody {
  endpoint: string;
  keys: Record<string, string>;
}

interface UnsubscribeBody {
  endpoint: string;
}

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
}
