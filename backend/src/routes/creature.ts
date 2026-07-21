import type { FastifyInstance } from "fastify";
import { creatureService } from "../services/creature.js";

interface ExerciseCompleteBody {
  duration: number;
}

export default async function creatureRoutes(fastify: FastifyInstance) {
  fastify.get("/creature", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.getState(request.userId);
  });

  fastify.post<{ Body: ExerciseCompleteBody }>("/creature/exercise/complete", { preHandler: [fastify.authenticate] }, async (request) => {
    return creatureService.completeExercise(request.userId, request.body.duration);
  });
}
