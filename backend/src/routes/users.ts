import type { FastifyInstance } from "fastify";
import { userService } from "../services/user.js";
import { updateMeSchema } from "../lib/validation.js";
import { AppError } from "../lib/errors.js";

interface UpdateMeBody {
  name?: string;
}

interface PreferencesBody {
  goals?: string[];
  experienceLevel?: string;
  dailyReminder?: boolean;
  reminderTime?: string;
  onboardingDone?: boolean;
  showSupportResources?: boolean;
}

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get("/users/me", { preHandler: [fastify.authenticate] }, async (request) => {
    return userService.findById(request.userId);
  });

  fastify.patch<{ Body: UpdateMeBody }>(
    "/users/me",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const parsed = updateMeSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError("VALIDATION_ERROR", 400, parsed.error.issues[0].message);
      }
      return userService.update(request.userId, parsed.data);
    },
  );

  fastify.delete("/users/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await userService.delete(request.userId);
    reply.status(204);
  });

  fastify.get("/users/me/preferences", { preHandler: [fastify.authenticate] }, async (request) => {
    return userService.getPreferences(request.userId);
  });

  fastify.put<{ Body: PreferencesBody }>(
    "/users/me/preferences",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return userService.upsertPreferences(request.userId, request.body);
    },
  );
}
