import type { FastifyInstance } from 'fastify';
import { userService } from '../services/user.js';
import { updateMeSchema, updatePreferencesSchema, parseOrThrow } from '../lib/validation.js';

interface UpdateMeBody {
  name?: string;
}

interface PreferencesBody {
  goals?: string[];
  experienceLevel?: string;
  dailyReminder?: boolean;
  reminderTime?: string;
  afternoonReminder?: boolean;
  afternoonTime?: string;
  eveningReminder?: boolean;
  eveningTime?: string;
  onboardingDone?: boolean;
  showSupportResources?: boolean;
}

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users/me', { preHandler: [fastify.authenticate] }, async (request) => {
    return userService.findById(request.userId);
  });

  fastify.patch<{ Body: UpdateMeBody }>(
    '/users/me',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const data = parseOrThrow(updateMeSchema, request.body);
      return userService.update(request.userId, data);
    },
  );

  fastify.delete('/users/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await userService.delete(request.userId);
    reply.status(204);
  });

  fastify.get('/users/me/preferences', { preHandler: [fastify.authenticate] }, async (request) => {
    return userService.getPreferences(request.userId);
  });

  fastify.put<{ Body: PreferencesBody }>(
    '/users/me/preferences',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const data = parseOrThrow(updatePreferencesSchema, request.body);
      return userService.upsertPreferences(request.userId, data);
    },
  );
}
