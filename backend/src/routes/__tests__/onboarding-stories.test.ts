import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();

  await prisma.onboardingStory.create({
    data: { title: "Welcome", content: "Hello!", order: 1 },
  });

  const result = await registerAndLogin(app, "onboarding-test@example.com", "secret123");
  token = result.token;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("OnboardingStories", () => {
  it("GET /onboarding-stories — returns stories ordered by order", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/onboarding-stories",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json()[0].title).toBe("Welcome");
  });
});
