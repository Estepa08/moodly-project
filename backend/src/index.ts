import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import parameterRoutes from "./routes/parameters.js";
import entryRoutes from "./routes/entries.js";
import testRoutes from "./routes/tests.js";
import testResultRoutes from "./routes/test-results.js";
import feedbackRoutes from "./routes/feedback.js";
import onboardingRoutes from "./routes/onboarding-stories.js";
import reportRoutes from "./routes/reports.js";
import creatureRoutes from "./routes/creature.js";
import { setErrorHandler } from "./lib/handle-error.js";

const fastify = Fastify({ logger: true });

await fastify.register(helmet, { contentSecurityPolicy: false });
await fastify.register(cors, { origin: true });
await fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" });

fastify.addHook("onRoute", (routeOptions) => {
  const method = routeOptions.method;
  if (typeof method === "string" && ["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    routeOptions.config = {
      ...(routeOptions.config as object),
      rateLimit: { max: 10, timeWindow: "1 minute" },
    };
  }
});

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
await fastify.register(creatureRoutes);

setErrorHandler(fastify);

const port = parseInt(process.env.PORT || "3001", 10);
await fastify.listen({ port, host: "0.0.0.0" });
