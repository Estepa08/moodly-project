import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

async function makeAdmin(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
}

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
});

describe("Admin", () => {
  it("GET /admin/users — rejects missing token", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/users" });
    expect(res.statusCode).toBe(401);
  });

  it("GET /admin/users — rejects non-admin user", async () => {
    const { token } = await registerAndLogin(app, "admin-regular@example.com", "secret123");
    const res = await app.inject({
      method: "GET",
      url: "/admin/users",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /admin/users — returns users for admin", async () => {
    const { token, userId } = await registerAndLogin(app, "admin-list@example.com", "secret123");
    await makeAdmin(userId);
    await registerAndLogin(app, "admin-target@example.com", "secret123");

    const res = await app.inject({
      method: "GET",
      url: "/admin/users",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const users = res.json();
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.some((u: { email: string }) => u.email === "admin-target@example.com")).toBe(true);
    expect(users.some((u: { email: string }) => u.email === "admin-list@example.com")).toBe(true);
    expect(users[0]).not.toHaveProperty("password");
    expect(users[0]).not.toHaveProperty("_count");
    expect(users[0]).toHaveProperty("entriesCount");
  });

  it("DELETE /admin/users/:id — deletes user", async () => {
    const { token, userId } = await registerAndLogin(app, "admin-delete@example.com", "secret123");
    await makeAdmin(userId);
    const { userId: targetId } = await registerAndLogin(
      app,
      "admin-delete-target@example.com",
      "secret123",
    );

    const res = await app.inject({
      method: "DELETE",
      url: `/admin/users/${targetId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);

    const remaining = await prisma.user.findUnique({ where: { id: targetId } });
    expect(remaining).toBeNull();
  });

  it("DELETE /admin/users/:id — rejects deleting yourself", async () => {
    const { token, userId } = await registerAndLogin(app, "admin-self@example.com", "secret123");
    await makeAdmin(userId);

    const res = await app.inject({
      method: "DELETE",
      url: `/admin/users/${userId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it("DELETE /admin/users/:id — returns 404 for unknown user", async () => {
    const { token, userId } = await registerAndLogin(app, "admin-404@example.com", "secret123");
    await makeAdmin(userId);

    const res = await app.inject({
      method: "DELETE",
      url: "/admin/users/nonexistent-id",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
