import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export default async function parameterRoutes(fastify: FastifyInstance) {
  fastify.get("/parameters", { preHandler: [fastify.authenticate] }, async () => {
    return prisma.parameter.findMany({ orderBy: { name: "asc" } });
  });
}
