import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getAllowedOrigins } from './lib/cors-origins.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import parameterRoutes from './routes/parameters.js';
import entryRoutes from './routes/entries.js';
import testRoutes from './routes/tests.js';
import testResultRoutes from './routes/test-results.js';
import feedbackRoutes from './routes/feedback.js';
import onboardingRoutes from './routes/onboarding-stories.js';
import creatureRoutes from './routes/creature.js';
import achievementRoutes from './routes/achievements.js';
import cbaRoutes from './routes/cba.js';
import notificationRoutes from './routes/notifications.js';
import syncRoutes from './routes/sync.js';
import adminRoutes from './routes/admin.js';
import emotionLabRoutes from './routes/emotion-lab.js';
import clientErrorRoutes from './routes/client-errors.js';
import contentRoutes from './routes/content.js';
import { ensureDefaultParameters } from './services/parameter.js';
import { setErrorHandler } from './lib/handle-error.js';
import { env } from './lib/env.js';
import { reminderScheduler } from './jobs/reminder-scheduler.js';
import { adventureScheduler } from './jobs/adventure-scheduler.js';

// Fail-fast валидация окружения (NODE_ENV, DATABASE_URL, JWT_SECRET,
// в проде FRONTEND_URL) до старта HTTP-сервера.
const fastify = Fastify({ logger: true, trustProxy: true });

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

const isProduction = env.NODE_ENV === 'production';
const readRateLimit = env.RATE_LIMIT_MAX ?? (isProduction ? 100 : 1000);
const writeRateLimit = env.RATE_LIMIT_WRITE_MAX ?? (isProduction ? 10 : 1000);
await fastify.register(rateLimit, { max: readRateLimit, timeWindow: '1 minute' });

fastify.addHook('onRoute', (routeOptions) => {
  const method = routeOptions.method;
  if (typeof method === 'string' && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    // Роут может задать собственный rateLimit (например, /client-errors
    // собирает пучки ошибок и не должен резаться по 10/мин).
    const existing = (routeOptions.config as { rateLimit?: object } | undefined)?.rateLimit;
    routeOptions.config = {
      ...(routeOptions.config as object),
      rateLimit: existing ?? { max: writeRateLimit, timeWindow: '1 minute' },
    };
  }
});

fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

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
await fastify.register(notificationRoutes);
await fastify.register(syncRoutes);
await fastify.register(adminRoutes);
await fastify.register(emotionLabRoutes);
await fastify.register(clientErrorRoutes);
await fastify.register(contentRoutes);

setErrorHandler(fastify);

// Гарантируем наличие базовых параметров (Anxiety, Mood, Energy, Sleep,
// Gratitude, Sleep Hygiene, Distortion Quiz, Thought Release, Day Activities)
// в любой БД — idempotent, без деструктивного ре-сида. Ошибка не должна
// ронять старт HTTP-сервера на уже существующей БД.
try {
  await ensureDefaultParameters();
} catch (err) {
  fastify.log.error({ err }, 'failed to ensure default parameters');
}

// Логируем необработанные отказы/исключения, чтобы тихое падение процесса
// было видно в логах Render вместо внезапного 502 без причин.
process.on('unhandledRejection', (reason) => {
  fastify.log.error({ err: reason }, 'unhandled rejection');
});
process.on('uncaughtException', (error) => {
  fastify.log.error(error, 'uncaught exception');
});

const port = env.PORT;
await fastify.listen({ port, host: '0.0.0.0' });

// Часовой планировщик push-напоминаний (dailyReminder + reminderTime).
// Только production: в dev/test VAPID-ключи обычно не настроены, а тесты
// вызывают reminderScheduler.runOnce() напрямую.
if (env.NODE_ENV === 'production') {
  reminderScheduler.start();
  adventureScheduler.start();
}
