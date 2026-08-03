import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
let userId: string;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, "achievements-test@example.com", "secret123");
  token = result.token;
  userId = result.userId;
});

afterEach(async () => {
  await prisma.userAchievement.deleteMany({ where: { userId } });
  await prisma.achievement.deleteMany();
  await prisma.practiceCompletion.deleteMany({ where: { userId } });
  await prisma.testResult.deleteMany({ where: { userId } });
  await prisma.test.deleteMany();
  await prisma.creatureState.delete({ where: { userId } }).catch(() => {});
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Achievements hidden flow", () => {
  it("hidden achievement is listed, unlocks via check, and grants its title", async () => {
    const title = "nightOwl";
    const ach = await prisma.achievement.create({
      data: {
        key: "mystery_owl_test",
        category: "hidden",
        titleKey: "achievements.mysteryOwl",
        descKey: "achievements.mysteryOwlDesc",
        iconName: "moon",
        titleReward: title,
        xpReward: 100,
        criteria: { type: "total_completions", value: 1 },
        sortOrder: 80,
      },
    });

    await prisma.creatureState.upsert({
      where: { userId },
      create: { userId, level: 1, experience: 0 },
      update: {},
    });

    await prisma.practiceCompletion.create({
      data: { userId, source: "practice_gratitude", xpAwarded: 10 },
    });

    const res = await app.inject({
      method: "POST",
      url: "/achievements/check",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const unlocked = res.json();
    expect(unlocked.some((a: { id: string }) => a.id === ach.id)).toBe(true);

    const state = await prisma.creatureState.findUnique({ where: { userId } });
    expect(state?.unlockedTitles ?? []).toContain(title);
  });

  it("GET /achievements returns hidden achievements with category hidden", async () => {
    await prisma.achievement.create({
      data: {
        key: "mystery_caretaker_test",
        category: "hidden",
        titleKey: "achievements.mysteryCaretaker",
        descKey: "achievements.mysteryCaretakerDesc",
        iconName: "heart",
        titleReward: "caretaker",
        xpReward: 100,
        criteria: { type: "feed_count", value: 400 },
        sortOrder: 81,
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/achievements",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const list = res.json();
    const item = list.find((a: { key: string }) => a.key === "mystery_caretaker_test");
    expect(item).toBeDefined();
    expect(item.category).toBe("hidden");
    expect(item.progress).toBe(0);
  });
});

describe("Achievements new criteria", () => {
  async function seedCreature() {
    await prisma.creatureState.upsert({
      where: { userId },
      create: { userId, level: 1, experience: 0 },
      update: {},
    });
  }

  async function createAch(key: string, criteria: Record<string, unknown>, title: string) {
    return prisma.achievement.create({
      data: {
        key,
        category: "general",
        titleKey: "achievements.level60",
        descKey: "achievements.level60Desc",
        iconName: "target",
        titleReward: title,
        xpReward: 100,
        criteria: criteria as never,
        sortOrder: 90,
      },
    });
  }

  async function checkAndExpect(title: string) {
    const res = await app.inject({
      method: "POST",
      url: "/achievements/check",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const state = await prisma.creatureState.findUnique({ where: { userId } });
    expect(state?.unlockedTitles ?? []).toContain(title);
  }

  it("unlocks via mood_entries criterion", async () => {
    await seedCreature();
    await createAch("mood_entries_test", { type: "mood_entries", value: 3 }, "mood_keeper");
    await prisma.practiceCompletion.createMany({
      data: [
        { userId, source: "moodEntry", xpAwarded: 5 },
        { userId, source: "moodEntry", xpAwarded: 5 },
        { userId, source: "moodEntry", xpAwarded: 5 },
      ],
    });
    await checkAndExpect("mood_keeper");
  });

  it("unlocks via gratitude_count criterion", async () => {
    await seedCreature();
    await createAch("gratitude_test", { type: "gratitude_count", value: 2 }, "sunbeam");
    await prisma.practiceCompletion.createMany({
      data: [
        { userId, source: "gratitude", xpAwarded: 5 },
        { userId, source: "gratitude", xpAwarded: 5 },
      ],
    });
    await checkAndExpect("sunbeam");
  });

  it("unlocks via thought_journal_count criterion", async () => {
    await seedCreature();
    await createAch("journal_test", { type: "thought_journal_count", value: 2 }, "soul_scribe");
    await prisma.practiceCompletion.createMany({
      data: [
        { userId, source: "thoughtJournal", xpAwarded: 5 },
        { userId, source: "thoughtJournal", xpAwarded: 5 },
      ],
    });
    await checkAndExpect("soul_scribe");
  });

  it("unlocks via test_count criterion", async () => {
    await seedCreature();
    await createAch("tests_test", { type: "test_count", value: 2 }, "know_thyself");
    const test = await prisma.test.create({
      data: { title: "Test", questions: [] },
    });
    await prisma.testResult.createMany({
      data: Array.from({ length: 2 }).map(() => ({
        testId: test.id,
        userId,
        score: 10,
        interpretation: "ok",
        recommendation: "keep going",
      })),
    });
    await checkAndExpect("know_thyself");
  });

  it("unlocks via night_practices criterion and counts only night hours", async () => {
    await seedCreature();
    await createAch("night_test", { type: "night_practices", value: 2 }, "stargazer");
    const night = new Date();
    night.setHours(23, 30, 0, 0);
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    await prisma.practiceCompletion.createMany({
      data: [
        { userId, source: "gratitude", xpAwarded: 5, createdAt: night },
        { userId, source: "thoughtJournal", xpAwarded: 5, createdAt: night },
        { userId, source: "gratitude", xpAwarded: 5, createdAt: day },
      ],
    });
    await checkAndExpect("stargazer");
  });
});
