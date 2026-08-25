import type { FastifyInstance } from 'fastify';
import { feedbackService } from '../services/feedback.js';
import { ValidationError } from '../lib/errors.js';
import { parsePagination, sendPaginated } from '../lib/pagination.js';

interface FeedbackCreateBody {
  rating: number;
  message: string;
}

export default async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: FeedbackCreateBody }>(
    '/feedback',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { rating, message } = request.body ?? {};
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new ValidationError('rating must be an integer between 1 and 5');
      }
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new ValidationError('message must be a non-empty string');
      }
      return feedbackService.create(request.userId, rating, message.trim());
    },
  );

  fastify.get('/feedback/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { skip, take } = parsePagination(request.query as { skip?: string; take?: string });
    const result = await feedbackService.listByUser(request.userId, skip, take);
    return sendPaginated(reply, result);
  });
}
