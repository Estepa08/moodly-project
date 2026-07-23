import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "./errors.js";

export function setErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ code: error.code, message: error.message });
      }

      const statusCode = (error as FastifyError).statusCode || 500;
      request.log.error(error);
      return reply.status(statusCode).send({ code: "INTERNAL", message: "Something went wrong" });
    },
  );
}
