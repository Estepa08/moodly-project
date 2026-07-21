import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
let testId: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  const test = await prisma.test.create({
    data: {
      title: "GAD-7",
      questions: [
        {
          id: "q1",
          text: "Feeling nervous?",
          options: [
            { id: "q1a", text: "Not at all", score: 0 },
            { id: "q1b", text: "Several days", score: 1 },
          ],
        },
      ],
    },
  });
  testId = test.id;

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "tests-test@example.com", password: "secret123" },
  });
  token = reg.json().accessToken;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Tests", () => {
  it("GET /tests — lists tests", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/tests",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it("GET /tests/:id — returns test with questions", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/tests/${testId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().questions).toBeDefined();
  });

  it("POST /tests/:id/results — submits answers and returns score", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/tests/${testId}/results`,
      headers: { authorization: `Bearer ${token}` },
      payload: { answers: [{ questionId: "q1", optionId: "q1b" }] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("score");
    expect(res.json()).toHaveProperty("interpretation");
    expect(res.json()).toHaveProperty("recommendation");
  });
});
