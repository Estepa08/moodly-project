import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { prisma } from "../../lib/prisma.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, "creature-test@example.com", "secret123", "Creature");
  token = result.token;
});

afterAll(async () => {
  await app.close();
});

describe("Creature pets", () => {
  it("GET /creature/pets — returns default starter collection", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/creature/pets",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      unlockedPetTypes: ["puff"],
      activePetType: "puff",
      petName: null,
    });
  });

  it("PATCH /creature/pet — unlocks a starter pet and sets the name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: { petType: "sloth", petName: "Ленивец" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      unlockedPetTypes: ["puff", "sloth"],
      activePetType: "sloth",
      petName: "Ленивец",
    });
  });

  it("PATCH /creature/pet — name only update keeps the pet type", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: { petName: "Дружок" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ activePetType: "sloth", petName: "Дружок" });
  });

  it("PATCH /creature/pet — rejects a non-starter locked pet", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: { petType: "giraffe" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("PATCH /creature/pet — empty petType and no petName is rejected", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /creature — state includes petName", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().petName).toBe("Дружок");
  });
});

describe("Creature mood and stage", () => {
  it("GET /creature — returns default petMood and stage", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().petMood).toBe("calm");
    expect(res.json().stage).toBe("baby");
  });

  it("GET /creature — petMood is happy on high recent mood entries", async () => {
    const moodParam = await prisma.parameter.create({ data: { name: "Mood" } });
    const user = await registerAndLogin(
      app,
      "creature-mood-high@example.com",
      "secret123",
      "Happy",
    );
    await prisma.entry.createMany({
      data: [
        { userId: user.userId, parameterId: moodParam.id, value: 9 },
        { userId: user.userId, parameterId: moodParam.id, value: 8 },
      ],
    });
    const res = await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().petMood).toBe("happy");
  });

  it("GET /creature — petMood is support on low recent mood entries", async () => {
    const moodParam = await prisma.parameter.create({ data: { name: "Mood" } });
    const user = await registerAndLogin(app, "creature-mood-low@example.com", "secret123", "Low");
    await prisma.entry.createMany({
      data: [
        { userId: user.userId, parameterId: moodParam.id, value: 3 },
        { userId: user.userId, parameterId: moodParam.id, value: 4 },
      ],
    });
    const res = await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().petMood).toBe("support");
  });

  it("GET /creature — stage grows with level", async () => {
    const user = await registerAndLogin(app, "creature-stage@example.com", "secret123", "Stage");
    await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${user.token}` },
    });
    const state = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    await prisma.creatureState.update({ where: { id: state!.id }, data: { level: 12 } });
    const res = await app.inject({
      method: "GET",
      url: "/creature",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().stage).toBe("adult");
  });
});

describe("Creature feed", () => {
  it("POST /creature/feed — increments feed counter for the active pet and awards +1 XP", async () => {
    const user = await registerAndLogin(app, "creature-feed@example.com", "secret123", "Feeder");
    await app.inject({
      method: "PATCH",
      url: "/creature/pet",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { petType: "sloth" },
    });

    const first = await app.inject({
      method: "POST",
      url: "/creature/feed",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      xpAwarded: 1,
      feedCount: 1,
      feedCounts: { sloth: 1 },
    });

    const second = await app.inject({
      method: "POST",
      url: "/creature/feed",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(second.json()).toMatchObject({
      feedCount: 2,
      feedCounts: { sloth: 2 },
    });
    expect(second.json().state.experience).toBeGreaterThan(first.json().state.experience);
  });

  it("POST /creature/feed — stops awarding XP after the daily limit", async () => {
    const user = await registerAndLogin(
      app,
      "creature-feed-limit@example.com",
      "secret123",
      "Limit",
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.practiceCompletion.createMany({
      data: Array.from({ length: 50 }, () => ({
        userId: user.userId,
        source: "feed",
        xpAwarded: 1,
        createdAt: today,
      })),
    });

    const res = await app.inject({
      method: "POST",
      url: "/creature/feed",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().xpAwarded).toBe(0);
    expect(res.json().feedCount).toBe(1);
    expect(res.json().feedCounts.puff).toBe(1);
  });

  it("GET /creature/stats — includes feedCount and feedCounts", async () => {
    const user = await registerAndLogin(
      app,
      "creature-feed-stats@example.com",
      "secret123",
      "Stats",
    );
    await app.inject({
      method: "POST",
      url: "/creature/feed",
      headers: { authorization: `Bearer ${user.token}` },
    });
    const res = await app.inject({
      method: "GET",
      url: "/creature/stats",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().feedCount).toBe(1);
    expect(res.json().feedCounts).toMatchObject({ puff: 1 });
  });

  it("GET /creature/pets — includes feedCounts", async () => {
    const user = await registerAndLogin(app, "creature-feed-pets@example.com", "secret123", "Pets");
    const res = await app.inject({
      method: "GET",
      url: "/creature/pets",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ unlockedPetTypes: ["puff"], activePetType: "puff" });
    expect(res.json().feedCounts).toBeDefined();
  });

  it("feed completions are excluded from practice counters", async () => {
    const user = await registerAndLogin(
      app,
      "creature-feed-exclude@example.com",
      "secret123",
      "Excl",
    );
    await app.inject({
      method: "POST",
      url: "/creature/feed",
      headers: { authorization: `Bearer ${user.token}` },
    });
    await app.inject({
      method: "POST",
      url: "/creature/reward",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { source: "gratitude" },
    });
    const res = await app.inject({
      method: "GET",
      url: "/creature/stats",
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().totalPractices).toBe(1);
    expect(res.json().sourceBreakdown).toEqual({ gratitude: 1 });
  });
});
