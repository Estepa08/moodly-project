import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, "user-test@example.com", "secret123", "Original");
  token = result.token;
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
    const { token: token2 } = await registerAndLogin(app, "delete-me@example.com", "secret123");
    const res = await app.inject({
      method: "DELETE",
      url: "/users/me",
      headers: { authorization: `Bearer ${token2}` },
    });
    expect(res.statusCode).toBe(204);
  });
});
