import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../test/helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();

  const res = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: "user-test@example.com", password: "secret123", name: "Original" },
  });
  token = res.json().accessToken;
});

afterAll(async () => {
  await app.close();
});

describe("Users", () => {
  it("GET /users/me — returns current user", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/users/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe("user-test@example.com");
  });

  it("PATCH /users/me — updates name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/users/me",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Updated" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Updated");
  });

  it("DELETE /users/me — deletes user", async () => {
    const reg = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "delete-me@example.com", password: "secret123" },
    });
    const t = reg.json().accessToken;

    const res = await app.inject({
      method: "DELETE",
      url: "/users/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });
});
