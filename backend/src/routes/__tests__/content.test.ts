import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import { contentService } from "../../services/content.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

async function makeAdmin(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
}

async function makeContentManager(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role: "content_manager" } });
}

const createdIds: string[] = [];

beforeAll(async () => {
  app = await buildApp();
  await prisma.motivationMessage.createMany({
    data: [
      { type: "morning", locale: "ru", text: "Доброе утро RU", question: "Как спали?", order: 1 },
      {
        type: "morning",
        locale: "ru",
        text: "Утро RU 2",
        question: "Что будете делать?",
        order: 2,
      },
      {
        type: "morning",
        locale: "en",
        text: "Good morning EN",
        question: "How did you sleep?",
        order: 1,
      },
      { type: "morning", locale: "en", text: "Morning EN 2", order: 2 },
      {
        type: "day",
        locale: "ru",
        text: "День RU",
        question: "Как проходит середина дня?",
        order: 1,
      },
      {
        type: "day",
        locale: "en",
        text: "Day EN",
        question: "How is the middle of the day going?",
        order: 1,
      },
      {
        type: "evening",
        locale: "ru",
        text: "Итог дня RU",
        question: "Как прошёл день?",
        order: 1,
      },
      { type: "evening", locale: "en", text: "Day summary EN", order: 1 },
    ],
  });
});

afterAll(async () => {
  if (createdIds.length > 0) {
    await prisma.motivationMessage.deleteMany({ where: { id: { in: createdIds } } });
  }
  await app.close();
});

describe("Content routes", () => {
  it("GET /content/message-of-day — rejects missing token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/content/message-of-day?type=morning&locale=ru",
    });
    expect(res.statusCode).toBe(401);
  });

  it("GET /content/message-of-day — returns message for authenticated user", async () => {
    const { token } = await registerAndLogin(app, "content-message@example.com", "secret123");
    const res = await app.inject({
      method: "GET",
      url: "/content/message-of-day?type=morning&locale=ru",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).not.toBeNull();
    expect(body.type).toBe("morning");
    expect(body.locale).toBe("ru");
    expect(typeof body.text).toBe("string");
    expect(body).not.toHaveProperty("order");
  });

  it("GET /content/message-of-day — validates type and locale", async () => {
    const { token } = await registerAndLogin(app, "content-message-2@example.com", "secret123");
    const bad = await app.inject({
      method: "GET",
      url: "/content/message-of-day?type=noon&locale=ru",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(bad.statusCode).toBe(400);
  });

  it("GET /content/messages — rejects regular user", async () => {
    const { token } = await registerAndLogin(app, "content-regular@example.com", "secret123");
    const res = await app.inject({
      method: "GET",
      url: "/content/messages",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("GET /content/message-of-day — returns day message", async () => {
    const { token } = await registerAndLogin(app, "content-message-day@example.com", "secret123");
    const res = await app.inject({
      method: "GET",
      url: "/content/message-of-day?type=day&locale=en",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.type).toBe("day");
    expect(body.locale).toBe("en");
  });

  it("GET /content/messages — returns list for content_manager", async () => {
    const { token, userId } = await registerAndLogin(app, "content-cm@example.com", "secret123");
    await makeContentManager(userId);
    const res = await app.inject({
      method: "GET",
      url: "/content/messages?locale=ru",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const list = res.json();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((m: { locale: string }) => m.locale === "ru")).toBe(true);
  });

  it("POST /content/messages — creates for admin; PATCH/DELETE roundtrip", async () => {
    const { token, userId } = await registerAndLogin(app, "content-admin@example.com", "secret123");
    await makeAdmin(userId);

    const create = await app.inject({
      method: "POST",
      url: "/content/messages",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        type: "morning",
        locale: "ru",
        text: "Тестовая фраза дня",
        question: "Как дела?",
        order: 42,
      },
    });
    expect(create.statusCode).toBe(200);
    const created = create.json();
    createdIds.push(created.id);
    expect(created.text).toBe("Тестовая фраза дня");

    const patch = await app.inject({
      method: "PATCH",
      url: `/content/messages/${created.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { isActive: false, question: null },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().isActive).toBe(false);
    expect(patch.json().question).toBeNull();

    const del = await app.inject({
      method: "DELETE",
      url: `/content/messages/${created.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(del.statusCode).toBe(204);
  });

  it("POST /content/messages — validates body", async () => {
    const { token, userId } = await registerAndLogin(
      app,
      "content-admin-2@example.com",
      "secret123",
    );
    await makeAdmin(userId);
    const res = await app.inject({
      method: "POST",
      url: "/content/messages",
      headers: { authorization: `Bearer ${token}` },
      payload: { type: "noon", locale: "ru", text: "x" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("contentService.messageOfDay", () => {
  it("returns deterministic message for a user/day, rotates on next day", async () => {
    const messages = await prisma.motivationMessage.findMany({
      where: { type: "morning", locale: "en", isActive: true },
      orderBy: [{ order: "asc" }],
    });
    expect(messages.length).toBeGreaterThanOrEqual(2);

    const a = await contentService.messageOfDay("morning", "en", "user-aaa");
    const b = await contentService.messageOfDay("morning", "en", "user-aaa");
    expect(a?.id).toBe(b?.id);

    const other = await contentService.messageOfDay("morning", "en", "user-bbb");
    expect(a?.id).not.toBe(other?.id);
  });

  it("returns null for unknown type or locale", async () => {
    expect(await contentService.messageOfDay("morning", "xx", "user-aaa")).toBeNull();
    expect(await contentService.messageOfDay("noon" as "morning", "ru", "user-aaa")).toBeNull();
  });
});
