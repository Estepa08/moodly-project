import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { getAllowedOrigins } from "./lib/cors-origins.js";
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
import practiceRoutes from "./routes/practices.js";
import recommendationRoutes from "./routes/recommendations.js";
import { setErrorHandler } from "./lib/handle-error.js";

const fastify = Fastify({ logger: true });

// This backend only ever serves JSON — it never renders scripts, styles, or
// frames — so the policy can be maximally strict rather than the
// browser-app-oriented defaults helmet ships with.
await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
});
await fastify.register(cors, { origin: getAllowedOrigins(), credentials: true });
await fastify.register(cookie);
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
await fastify.register(practiceRoutes);
await fastify.register(recommendationRoutes);

setErrorHandler(fastify);

const port = parseInt(process.env.PORT || "3001", 10);
await fastify.listen({ port, host: "0.0.0.0" });
