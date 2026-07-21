import type { FastifyInstance } from "fastify";
import { testService } from "../services/test.js";

export default async function testResultRoutes(fastify: FastifyInstance) {
  fastify.get("/test-results", { preHandler: [fastify.authenticate] }, async (request) => {
    const { testId } = request.query as { testId?: string };
    return testService.listResults(request.userId, testId);
  });

  fastify.get<{ Params: { id: string } }>("/test-results/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    return testService.getResultById(request.params.id, request.userId);
  });
}
