import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  await prisma.parameter.createMany({
    data: [
      { name: "Anxiety", unit: "/10" },
      { name: "Sleep", unit: "/10" },
    ],
  });

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "params-test@example.com", password: "secret123" },
  });
  token = res.json().accessToken;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Parameters", () => {
  it("GET /parameters — returns all parameters", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/parameters",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBeGreaterThanOrEqual(2);
  });
});
