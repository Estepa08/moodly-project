import type { FastifyInstance } from "fastify";
import { achievementsService } from "../services/achievements.js";

interface SkinBody {
  skin: string;
}

interface TitleBody {
  title: string | null;
}

export default async function achievementRoutes(fastify: FastifyInstance) {
  fastify.get("/achievements", { preHandler: [fastify.authenticate] }, async (request) => {
    return achievementsService.getAll(request.userId);
  });

  fastify.post("/achievements/check", { preHandler: [fastify.authenticate] }, async (request) => {
    return achievementsService.check(request.userId);
  });

  fastify.get("/creature/skins", { preHandler: [fastify.authenticate] }, async (request) => {
    return achievementsService.getSkins(request.userId);
  });

  fastify.patch<{ Body: SkinBody }>(
    "/creature/skin",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        return await achievementsService.setSkin(request.userId, request.body.skin);
      } catch (e) {
        return reply.status(400).send({ error: (e as Error).message });
      }
    },
  );

  fastify.patch<{ Body: TitleBody }>(
    "/creature/title",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        return await achievementsService.setTitle(request.userId, request.body.title);
      } catch (e) {
        return reply.status(400).send({ error: (e as Error).message });
      }
    },
  );
}
