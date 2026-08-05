import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
let userId: string;
let parameterId: string;
let entryId: string;
const prisma = new PrismaClient();

let seq = 0;
const entryIdFor = (label: string) => `entry-${label}-${Date.now()}-${seq++}`;

beforeAll(async () => {
  app = await buildApp();

  const param = await prisma.parameter.create({ data: { name: "Energy", unit: "/10" } });
  parameterId = param.id;

  const result = await registerAndLogin(app, "entries-test@example.com", "secret123");
  token = result.token;
  userId = result.userId;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Entries", () => {
  it("POST /entries — creates an entry", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/entries",
      headers: { authorization: `Bearer ${token}` },
      payload: { id: entryIdFor("one"), parameterId, encryptedData: "ENC:1" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().encryptedData).toBe("ENC:1");
    expect(res.json().value).toBeNull();
    entryId = res.json().id;
  });

  it("POST /entries — ignores injected userId in body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/entries",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        id: entryIdFor("two"),
        parameterId,
        encryptedData: "ENC:2",
        userId: "00000000000000000000000000",
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().userId).toBe(userId);
  });

  it("GET /entries — lists user entries", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/entries",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
    expect(res.json().length).toBeGreaterThanOrEqual(1);
  });

  it("GET /entries/:id — returns single entry", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/entries/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().encryptedData).toBe("ENC:1");
  });

  it("PATCH /entries/:id — updates entry", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/entries/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { encryptedData: "ENC:3" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().encryptedData).toBe("ENC:3");
  });

  it("DELETE /entries/:id — deletes entry", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/entries/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(204);
  });
});

describe("Entries reward mood XP", () => {
  it("POST /entries — Mood entry awards +5 XP (up to 3 per day)", async () => {
    const moodParam = await prisma.parameter.create({ data: { name: "Mood" } });
    const user = await registerAndLogin(app, "entries-mood@example.com", "secret123", "Moody");

    const getXp = async () => {
      const res = await app.inject({
        method: "GET",
        url: "/creature",
        headers: { authorization: `Bearer ${user.token}` },
      });
      return res.json().experience;
    };

    expect(await getXp()).toBe(0);

    for (let i = 0; i < 3; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/entries",
        headers: { authorization: `Bearer ${user.token}` },
        payload: {
          id: entryIdFor(`mood-${i}`),
          parameterId: moodParam.id,
          encryptedData: "ENC:xp",
        },
      });
      expect(res.statusCode).toBe(200);
    }
    expect(await getXp()).toBe(15);

    const res = await app.inject({
      method: "POST",
      url: "/entries",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { id: entryIdFor("mood-x"), parameterId: moodParam.id, encryptedData: "ENC:xp" },
    });
    expect(res.statusCode).toBe(200);
    expect(await getXp()).toBe(15);
  });

  it("POST /entries — non-Mood entry awards no XP", async () => {
    const user = await registerAndLogin(app, "entries-nonmood@example.com", "secret123", "Energy");
    const res = await app.inject({
      method: "POST",
      url: "/entries",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { id: entryIdFor("nonmood"), parameterId, encryptedData: "ENC:xp" },
    });
    expect(res.statusCode).toBe(200);
    const state = await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(state.json().experience).toBe(0);
  });
});

describe("Entries daily limit — race safety", () => {
  it("POST /entries — concurrent creates cannot exceed 100/day", async () => {
    const user = await registerAndLogin(app, "entries-limit@example.com", "secret123", "Limit");

    const requests = Array.from({ length: 130 }, () =>
      app.inject({
        method: "POST",
        url: "/entries",
        headers: { authorization: `Bearer ${user.token}` },
        payload: { id: entryIdFor("limit"), parameterId, encryptedData: "ENC:xp" },
      }),
    );
    const results = await Promise.all(requests);

    const ok = results.filter((r) => r.statusCode === 200).length;
    const limited = results.filter((r) => r.statusCode === 429).length;

    expect(ok).toBe(100);
    expect(limited).toBe(30);

    const dbCount = await prisma.entry.count({ where: { userId: user.userId } });
    expect(dbCount).toBe(100);
  });
});
