import type { FastifyInstance } from "fastify";
import { userService } from "../services/user.js";

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
    const user = await userService.register({ email, password, name });
    const accessToken = await reply.jwtSign({ userId: user.id });
    return { accessToken, user };
  });

  fastify.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { email, password } = request.body;
    const user = await userService.login({ email, password });
    const accessToken = await reply.jwtSign({ userId: user.id });
    return { accessToken, user };
  });

  fastify.post("/auth/logout", { preHandler: [fastify.authenticate] }, async () => {});

  // DEMO-ONLY: remove before production
  fastify.post("/auth/demo", async (request, reply) => {
    const user = await userService.createDemo();
    const accessToken = await reply.jwtSign({ userId: user.id });
    return { accessToken, user };
  });
}
