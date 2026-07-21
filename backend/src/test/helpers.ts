import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import authPlugin from "../plugins/auth.js";
import authRoutes from "../routes/auth.js";
import userRoutes from "../routes/users.js";
import parameterRoutes from "../routes/parameters.js";
import entryRoutes from "../routes/entries.js";
import testRoutes from "../routes/tests.js";
import testResultRoutes from "../routes/test-results.js";
import feedbackRoutes from "../routes/feedback.js";
import onboardingRoutes from "../routes/onboarding-stories.js";
import reportRoutes from "../routes/reports.js";
import { PrismaClient } from "@prisma/client";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false });

  await fastify.register(cors, { origin: true });
  await fastify.register(authPlugin);
  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
  await fastify.register(parameterRoutes);
  await fastify.register(entryRoutes);
  await fastify.register(testRoutes);
  await fastify.register(testResultRoutes);
  await fastify.register(feedbackRoutes);
  await fastify.register(onboardingRoutes);
  await fastify.register(reportRoutes);

  await fastify.ready();
  return fastify;
}

export async function seedTestData(prisma: PrismaClient) {
  const parameter = await prisma.parameter.create({
    data: { name: "Anxiety", description: "Test", unit: "/10" },
  });
  return { parameter };
}
