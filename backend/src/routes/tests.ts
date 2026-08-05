import type { FastifyInstance } from "fastify";
import { testService } from "../services/test.js";

export default async function testRoutes(fastify: FastifyInstance) {
  fastify.get("/tests", { preHandler: [fastify.authenticate] }, async () => {
    return testService.list();
  });

  fastify.get<{ Params: { id: string } }>(
    "/tests/:id",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return testService.getById(request.params.id);
    },
  );
}
