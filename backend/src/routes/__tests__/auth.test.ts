import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe("Auth", () => {
  it("POST /auth/register — creates user and returns accessToken", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "test@example.com",
        password: "secret123",
        name: "Test",
        ageConfirmed: true,
      },
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
      payload: { email: "test@example.com", password: "secret123", ageConfirmed: true },
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST /auth/login — returns token for valid credentials", async () => {
    const { token } = await registerAndLogin(app, "login-test@example.com", "secret123");
    expect(token).toBeDefined();
  });

  it("POST /auth/login — rejects wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "login-test@example.com", password: "wrong" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("POST /auth/logout — accepts valid token", async () => {
    const { token } = await registerAndLogin(app, "logout-test@example.com", "secret123");
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

  it("POST /auth/refresh — parallel refresh with one token returns no 500", async () => {
    const reg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "refresh-race@example.com", password: "secret123", ageConfirmed: true },
    });
    expect(reg.statusCode).toBe(200);

    const setCookie = reg.headers["set-cookie"] as string | undefined;
    expect(setCookie).toBeDefined();
    const cookie = setCookie.split(";")[0];

    const [a, b] = await Promise.all([
      app.inject({ method: "POST", url: "/auth/refresh", headers: { cookie } }),
      app.inject({ method: "POST", url: "/auth/refresh", headers: { cookie } }),
    ]);

    const codes = [a.statusCode, b.statusCode].sort((x, y) => x - y);
    expect(codes[0]).toBe(200);
    expect(codes[1]).toBe(401);
    expect(codes).not.toContain(500);
  });
});
