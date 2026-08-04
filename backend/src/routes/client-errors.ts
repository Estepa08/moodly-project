import type { FastifyInstance } from "fastify";
import { z } from "zod";

const clientErrorSchema = z.object({
  message: z.string().min(1).max(2000),
  source: z.string().max(1000).optional(),
  lineno: z.number().int().optional(),
  colno: z.number().int().optional(),
  stack: z.string().max(10000).optional(),
  url: z.string().max(1000).optional(),
  userAgent: z.string().max(500).optional(),
});

// Приём клиентских ошибок (window.onerror / unhandledrejection) для
// видимости проблем пользователей в логах прода. Роут публичный: ошибки
// клиента случаются до/вне авторизации, лог пишется без чувствительных
// данных (тело валидируется zod, stack обрезается схемой).
export default async function clientErrorRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: unknown }>(
    "/client-errors",
    {
      config: {
        rateLimit: { max: 60, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      const parsed = clientErrorSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ code: "BAD_REQUEST", message: "Invalid error payload" });
      }
      const { message, source, lineno, colno, stack, url, userAgent } = parsed.data;
      request.log.warn(
        {
          clientError: { message, source, lineno, colno, stack, url },
          userAgent: userAgent ?? request.headers["user-agent"],
        },
        "client-side error reported",
      );
      return { ok: true };
    },
  );
}
