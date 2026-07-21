import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>("/auth/register", async (request, reply) => {
    const { email, password, name } = request.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ code: "EMAIL_EXISTS", message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });

    const accessToken = await reply.jwtSign({ userId: user.id });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    };
  });

  fastify.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { email, password } = request.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }

    const accessToken = await reply.jwtSign({ userId: user.id });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    };
  });

  fastify.post("/auth/logout", { preHandler: [fastify.authenticate] }, async () => {
    return;
  });
}
