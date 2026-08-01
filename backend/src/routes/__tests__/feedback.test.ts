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
  it("POST /feedback — creates feedback with rating", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/feedback",
      headers: { authorization: `Bearer ${token}` },
      payload: { rating: 5, message: "Great app!" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.rating).toBe(5);
    expect(body.message).toBe("Great app!");
  });

  it("POST /feedback — updates existing feedback instead of duplicating", async () => {
    await app.inject({
      method: "POST",
      url: "/feedback",
      headers: { authorization: `Bearer ${token}` },
      payload: { rating: 4, message: "Better than before" },
    });
    const list = await app.inject({
      method: "GET",
      url: "/feedback/me",
      headers: { authorization: `Bearer ${token}` },
    });
    const items = list.json();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(1);
    expect(items[0].rating).toBe(4);
    expect(items[0].message).toBe("Better than before");
  });

  it("POST /feedback — rejects invalid rating", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/feedback",
      headers: { authorization: `Bearer ${token}` },
      payload: { rating: 6, message: "too high" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /feedback — rejects empty message", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/feedback",
      headers: { authorization: `Bearer ${token}` },
      payload: { rating: 3, message: "   " },
    });
    expect(res.statusCode).toBe(400);
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
