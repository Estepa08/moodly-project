import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import authPlugin from "../plugins/auth.js";
import authRoutes from "../routes/auth.js";
import userRoutes from "../routes/users.js";
import parameterRoutes from "../routes/parameters.js";
import entryRoutes from "../routes/entries.js";
import testRoutes from "../routes/tests.js";
import testResultRoutes from "../routes/test-results.js";
import feedbackRoutes from "../routes/feedback.js";
import onboardingRoutes from "../routes/onboarding-stories.js";
import creatureRoutes from "../routes/creature.js";
import achievementRoutes from "../routes/achievements.js";
import cbaRoutes from "../routes/cba.js";
import syncRoutes from "../routes/sync.js";
import adminRoutes from "../routes/admin.js";
import { setErrorHandler } from "../lib/handle-error.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false });

  await fastify.register(cors, { origin: true, credentials: true });
  await fastify.register(cookie);
  await fastify.register(authPlugin);
  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
  await fastify.register(parameterRoutes);
  await fastify.register(entryRoutes);
  await fastify.register(testRoutes);
  await fastify.register(testResultRoutes);
  await fastify.register(feedbackRoutes);
  await fastify.register(onboardingRoutes);
  await fastify.register(creatureRoutes);
  await fastify.register(achievementRoutes);
  await fastify.register(cbaRoutes);
  await fastify.register(syncRoutes);
  await fastify.register(adminRoutes);

  setErrorHandler(fastify);

  await fastify.ready();
  return fastify;
}

export async function registerAndLogin(
  app: FastifyInstance,
  email: string,
  password = "secret123",
  name?: string,
): Promise<{ token: string; userId: string }> {
  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: {
      email,
      password,
      name,
      ageConfirmed: true,
      pdpConsent: true,
      wrappedKey: "dGVzdC13cmFwcGVkLWtleQ==",
      keySalt: "dGVzdC1zYWx0",
      recoveryWrappedKey: "dGVzdC1yZWNvdmVyeQ==",
      recoverySalt: "dGVzdC1yZWNvdmVyeS1zYWx0",
    },
  });
  const body = reg.json();
  return { token: body.accessToken, userId: body.user.id };
}
