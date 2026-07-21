import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../test/helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe("Auth", () => {
  it("POST /auth/register — creates user and returns token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "test@example.com", password: "secret123", name: "Test" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("accessToken");
    expect(body.user.email).toBe("test@example.com");
  });

  it("POST /auth/register — rejects duplicate email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "test@example.com", password: "secret123" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST /auth/login — returns token for valid credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com", password: "secret123" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("accessToken");
  });

  it("POST /auth/login — rejects wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com", password: "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /auth/logout — accepts valid token", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "test@example.com", password: "secret123" },
    });
    const token = login.json().accessToken;

    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /users/me — rejects missing token", async () => {
    const res = await app.inject({ method: "GET", url: "/users/me" });
    expect(res.statusCode).toBe(401);
  });

  // DEMO-ONLY: remove before production
  it("POST /auth/demo — creates user and returns token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/demo",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("accessToken");
    expect(res.json().user.name).toBe("Demo User");
  });
});
