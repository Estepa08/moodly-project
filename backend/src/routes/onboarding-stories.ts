import type { FastifyInstance } from "fastify";
import { onboardingService } from "../services/onboarding.js";

export default async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.get("/onboarding-stories", { preHandler: [fastify.authenticate] }, async () => {
    return onboardingService.list();
  });
}
