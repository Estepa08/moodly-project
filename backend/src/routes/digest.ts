import type { FastifyInstance } from "fastify";
import { digestService } from "../services/digest.js";

export default async function digestRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/digest/weekly",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return digestService.getWeekly(request.userId);
    },
  );
}
