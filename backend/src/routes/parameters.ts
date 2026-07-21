import type { FastifyInstance } from "fastify";
import { parameterService } from "../services/parameter.js";

export default async function parameterRoutes(fastify: FastifyInstance) {
  fastify.get("/parameters", { preHandler: [fastify.authenticate] }, async () => {
    return parameterService.list();
  });
}
