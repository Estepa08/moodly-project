import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

interface SubmitResultBody {
  answers: { questionId: string; optionId: string }[];
}

export default async function testRoutes(fastify: FastifyInstance) {
  fastify.get("/tests", { preHandler: [fastify.authenticate] }, async () => {
    return prisma.test.findMany({
      select: { id: true, title: true, description: true, questions: false },
    });
  });

  fastify.get<{ Params: { id: string } }>("/tests/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    return prisma.test.findFirstOrThrow({ where: { id: request.params.id } });
  });

  fastify.post<{ Params: { id: string }; Body: SubmitResultBody }>("/tests/:id/results", { preHandler: [fastify.authenticate] }, async (request) => {
    const test = await prisma.test.findFirstOrThrow({ where: { id: request.params.id } });
    const questions = test.questions as { id: string; options: { id: string; score: number }[] }[];

    let score = 0;
    for (const answer of request.body.answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) continue;
      const option = question.options.find((o) => o.id === answer.optionId);
      if (option) score += option.score;
    }

    const maxScore = questions.reduce((sum, q) => {
      return sum + Math.max(...q.options.map((o) => o.score));
    }, 0);
    const ratio = maxScore > 0 ? score / maxScore : 0;

    let interpretation: string;
    let recommendation: string;
    if (ratio < 0.33) {
      interpretation = "Low score";
      recommendation = "No immediate concerns, continue monitoring.";
    } else if (ratio < 0.66) {
      interpretation = "Moderate score";
      recommendation = "Consider discussing with a specialist if symptoms persist.";
    } else {
      interpretation = "Elevated score";
      recommendation = "We recommend consulting a mental health professional.";
    }

    const result = await prisma.testResult.create({
      data: {
        testId: test.id,
        userId: request.userId,
        score,
        interpretation,
        recommendation,
      },
    });

    return result;
  });
}
