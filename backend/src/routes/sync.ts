import type { FastifyInstance } from "fastify";
import { syncService, type SyncAction } from "../services/sync.js";

interface PushBody {
  actions: SyncAction[];
}

interface PullQuery {
  since?: string;
  sinceId?: string;
  limit?: string;
}

export default async function syncRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: PushBody }>(
    "/sync/push",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return syncService.push(request.userId, request.body.actions);
    },
  );

  fastify.get<{ Querystring: PullQuery }>(
    "/sync/pull",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : undefined;
      return syncService.pull(request.userId, {
        since: request.query.since,
        sinceId: request.query.sinceId,
        limit,
      });
    },
  );
}
