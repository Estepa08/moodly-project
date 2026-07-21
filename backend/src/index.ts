import Fastify from "fastify";
import cors from "@fastify/cors";
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

const fastify = Fastify({ logger: true });

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

const port = parseInt(process.env.PORT || "3001", 10);
await fastify.listen({ port, host: "0.0.0.0" });
