import type { FastifyInstance } from "fastify";
import { practiceService } from "../services/practice.js";

export default async function practiceRoutes(fastify: FastifyInstance) {
  fastify.get("/practices", { preHandler: [fastify.authenticate] }, async () => {
    return practiceService.list();
  });
}
