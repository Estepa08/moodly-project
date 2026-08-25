import { FastifyInstance } from 'fastify';
import { ValidationError } from '../lib/errors.js';
import { emotionLabService } from '../services/emotion-lab.js';

export default async function emotionLabRoutes(fastify: FastifyInstance) {
  fastify.get('/emotion-lab/state', { preHandler: [fastify.authenticate] }, async (req) => {
    return emotionLabService.getState(req.userId);
  });

  fastify.post(
    '/emotion-lab/attempt',
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const { emotionA, emotionB } = req.body as { emotionA: string; emotionB: string };
      if (!emotionA || !emotionB) {
        throw new ValidationError('emotionA and emotionB are required');
      }

      const result = await emotionLabService.recordAttempt(req.userId, emotionA, emotionB);
      if (!result.ok) {
        // Не AppError: клиенту нужны limit/tier/resetsAt, а не только code+message.
        return reply.code(403).send({
          error: result.reason,
          limit: result.limit,
          tier: result.tier,
          resetsAt: result.resetsAt,
        });
      }

      const { ok: _ok, ...body } = result;
      return body;
    },
  );
}
