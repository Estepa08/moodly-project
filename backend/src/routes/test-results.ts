import type { FastifyInstance } from "fastify";
import { testService } from "../services/test.js";

export default async function testResultRoutes(fastify: FastifyInstance) {
  fastify.get("/test-results", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { testId, skip, take } = request.query as { testId?: string; skip?: string; take?: string };
    const result = await testService.listResults(request.userId, testId, skip ? parseInt(skip, 10) : undefined, take ? parseInt(take, 10) : undefined);
    reply.header("X-Total-Count", result.total);
    return result.data;
  });

  fastify.get<{ Params: { id: string } }>("/test-results/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    return testService.getResultById(request.params.id, request.userId);
  });
}
