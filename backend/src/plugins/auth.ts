import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireContentManager: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string };
    user: { userId: string };
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  // No fallback: a missing secret must crash startup, not silently sign
  // tokens with a value anyone can read in this source file.
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable must be set");
  }

  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
  });

  fastify.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
      request.userId = request.user.userId;
    } catch {
      return reply.status(401).send({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
    }
  });

  fastify.decorate("requireAdmin", async function (request: FastifyRequest, reply: FastifyReply) {
    await fastify.authenticate(request, reply);
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { role: true },
    });
    if (!user || user.role !== "admin") {
      return reply.status(403).send({ code: "FORBIDDEN", message: "Admin access required" });
    }
  });

  fastify.decorate(
    "requireContentManager",
    async function (request: FastifyRequest, reply: FastifyReply) {
      await fastify.authenticate(request, reply);
      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { role: true },
      });
      if (!user || (user.role !== "admin" && user.role !== "content_manager")) {
        return reply
          .status(403)
          .send({ code: "FORBIDDEN", message: "Content manager access required" });
      }
    },
  );
});
