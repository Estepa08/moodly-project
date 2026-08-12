import type { FastifyInstance } from 'fastify';
import { contentService, type MessageInput } from '../services/content.js';
import { AppError, NotFoundError } from '../lib/errors.js';

const MESSAGE_TYPES = ['morning', 'day', 'evening'];
const LOCALES = ['ru', 'en'];

export default async function contentRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { type?: string; locale?: string } }>(
    '/content/message-of-day',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { type, locale } = request.query;
      if (!type || !MESSAGE_TYPES.includes(type)) {
        throw new AppError('VALIDATION_ERROR', 400, "type must be 'morning', 'day' or 'evening'");
      }
      if (!locale || !LOCALES.includes(locale)) {
        throw new AppError('VALIDATION_ERROR', 400, "locale must be 'ru' or 'en'");
      }
      const message = await contentService.messageOfDay(
        type as 'morning' | 'day' | 'evening',
        locale,
        request.userId,
      );
      if (!message) return null;
      return {
        id: message.id,
        type: message.type,
        locale: message.locale,
        text: message.text,
        question: message.question,
      };
    },
  );

  fastify.get<{ Querystring: { type?: string; locale?: string; active?: string } }>(
    '/content/messages',
    { preHandler: [fastify.requireContentManager] },
    async (request) => {
      const { type, locale, active } = request.query;
      return contentService.list({
        type,
        locale,
        activeOnly: active === 'true',
      });
    },
  );

  fastify.post<{ Body: MessageInput }>(
    '/content/messages',
    { preHandler: [fastify.requireContentManager] },
    async (request) => {
      const body = request.body ?? {};
      if (!MESSAGE_TYPES.includes(body.type ?? '')) {
        throw new AppError('VALIDATION_ERROR', 400, "type must be 'morning', 'day' or 'evening'");
      }
      if (!LOCALES.includes(body.locale ?? '')) {
        throw new AppError('VALIDATION_ERROR', 400, "locale must be 'ru' or 'en'");
      }
      if (!body.text || !body.text.trim()) {
        throw new AppError('VALIDATION_ERROR', 400, 'text is required');
      }
      return contentService.create(body);
    },
  );

  fastify.patch<{ Params: { id: string }; Body: Partial<MessageInput> }>(
    '/content/messages/:id',
    { preHandler: [fastify.requireContentManager] },
    async (request) => {
      try {
        return await contentService.update(request.params.id, request.body ?? {});
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        throw err;
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    '/content/messages/:id',
    { preHandler: [fastify.requireContentManager] },
    async (request, reply) => {
      await contentService.remove(request.params.id);
      reply.status(204);
    },
  );
}
