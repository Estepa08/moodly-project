import type { FastifyInstance } from "fastify";
import { userService } from "../services/user.js";

interface UpdateMeBody {
  name?: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/users/me", { preHandler: [fastify.authenticate] }, async (request) => {
    return userService.findById(request.userId);
  });

  fastify.patch<{ Body: UpdateMeBody }>(
    "/users/me",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return userService.update(request.userId, request.body);
    },
  );

  fastify.delete("/users/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await userService.delete(request.userId);
    reply.status(204);
  });
}
