import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, "feedback-test@example.com", "secret123");
  token = result.token;
});

afterAll(async () => {
  await app.close();
});

describe("Feedback", () => {
  it("POST /feedback — creates feedback", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/feedback",
      headers: { authorization: `Bearer ${token}` },
      payload: { message: "Great app!" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().message).toBe("Great app!");
  });

  it("GET /feedback/me — lists user feedback", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/feedback/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });
});
