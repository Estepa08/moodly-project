import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
let resultId: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  const test = await prisma.test.create({
    data: {
      title: "PHQ-9",
      questions: [
        {
          id: "q1",
          text: "Little interest in doing things?",
          options: [
            { id: "q1a", text: "Not at all", score: 0 },
            { id: "q1b", text: "Several days", score: 1 },
          ],
        },
      ],
    },
  });

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "results-test@example.com", password: "secret123" },
  });
  token = reg.json().accessToken;

  const resultRes = await app.inject({
    method: "POST",
    url: `/tests/${test.id}/results`,
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: [{ questionId: "q1", optionId: "q1b" }] },
  });
  resultId = resultRes.json().id;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("TestResults", () => {
  it("GET /test-results — lists user results", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/test-results",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it("GET /test-results/:id — returns single result", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/test-results/${resultId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("score");
  });
});
