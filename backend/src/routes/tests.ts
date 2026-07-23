import type { FastifyInstance } from "fastify";
import { testService } from "../services/test.js";

interface SubmitResultBody {
  answers: { questionId: string; optionId: string }[];
}

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

  fastify.post<{ Params: { id: string }; Body: SubmitResultBody }>(
    "/tests/:id/results",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return testService.submitResult(request.params.id, request.userId, request.body.answers);
    },
  );
}
