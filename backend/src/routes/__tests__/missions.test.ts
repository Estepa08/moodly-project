import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
let userId: string;
const prisma = new PrismaClient();

async function createMission(missionKey: string, labelKey: string, xpReward: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.dailyMission.upsert({
    where: { userId_date_missionKey: { userId, date: today, missionKey } },
    update: { labelKey, xpReward },
    create: {
      userId,
      date: today,
      missionKey,
      labelKey,
      xpReward,
      sortOrder: 0,
    },
  });
}

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, "missions-test@example.com", "secret123");
  token = result.token;
  userId = result.userId;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Creature missions", () => {
  it("GET /creature/missions — creates 3 random missions for the day", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const missions = res.json();
    expect(missions).toHaveLength(3);
    for (const m of missions) {
      expect(m).toHaveProperty("missionKey");
      expect(m).toHaveProperty("labelKey");
      expect(m).toHaveProperty("xpReward");
      expect(m).toHaveProperty("progress");
      expect(m).toHaveProperty("claimed");
    }
  });

  it("practice source mission — progress 0 -> 1 after rewardPractice, claim awards XP", async () => {
    const mission = await createMission("practice_gratitude", "missions.practiceGratitude", 10);

    let res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    const before = res.json().find((m: { id: string }) => m.id === mission.id);
    expect(before.progress).toBe(0);

    await app.inject({
      method: "POST",
      url: "/creature/reward",
      headers: { authorization: `Bearer ${token}` },
      payload: { source: "gratitude" },
    });

    res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    const after = res.json().find((m: { id: string }) => m.id === mission.id);
    expect(after.progress).toBe(1);

    const stateBefore = await prisma.creatureState.findUnique({ where: { userId } });
    const xpBefore = stateBefore?.experience ?? 0;

    res = await app.inject({
      method: "POST",
      url: `/creature/missions/${mission.id}/claim`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const claim = res.json();
    expect(claim.claimed).toBe(true);
    expect(claim.xpAwarded).toBe(10);

    const stateAfter = await prisma.creatureState.findUnique({ where: { userId } });
    expect(stateAfter?.experience).toBe(xpBefore + 10);
  });

  it("log_mood_entry mission — progresses after an entry is created", async () => {
    const mission = await createMission("log_mood_entry", "missions.logMoodEntry", 5);

    const param = await prisma.parameter.create({ data: { name: "MissionEnergy" } });

    await app.inject({
      method: "POST",
      url: "/entries",
      headers: { authorization: `Bearer ${token}` },
      payload: { parameterId: param.id, value: 7 },
    });

    const res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    const missionState = res.json().find((m: { id: string }) => m.id === mission.id);
    expect(missionState.progress).toBe(1);
  });

  it("complete_test mission — progresses after a test result exists today", async () => {
    const mission = await createMission("complete_test", "missions.completeTest", 15);

    const test = await prisma.test.create({
      data: { title: "Mission test", questions: [] },
    });
    await prisma.testResult.create({
      data: {
        testId: test.id,
        userId,
        score: 5,
        interpretation: "ok",
        recommendation: "keep going",
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    const missionState = res.json().find((m: { id: string }) => m.id === mission.id);
    expect(missionState.progress).toBe(1);
  });

  it("complete_5_practices mission — progress scales with completions", async () => {
    const mission = await createMission("complete_5_practices", "missions.complete5Practices", 20);

    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: "POST",
        url: "/creature/reward",
        headers: { authorization: `Bearer ${token}` },
        payload: { source: "thoughtJournal" },
      });
    }

    const res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    const missionState = res.json().find((m: { id: string }) => m.id === mission.id);
    expect(missionState.progress).toBe(1);
  });

  it("streak_2 mission — progress 0 until a 2-day streak is reached", async () => {
    const mission = await createMission("streak_2", "missions.streak2", 10);

    let res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    const before = res.json().find((m: { id: string }) => m.id === mission.id);
    expect(before.progress).toBe(0);

    await prisma.creatureState.update({
      where: { userId },
      data: { streak: 3 },
    });

    res = await app.inject({
      method: "GET",
      url: "/creature/missions",
      headers: { authorization: `Bearer ${token}` },
    });
    const after = res.json().find((m: { id: string }) => m.id === mission.id);
    expect(after.progress).toBe(1);
  });

  it("claiming an incomplete mission is rejected", async () => {
    const mission = await createMission(
      "practice_sleepHygiene",
      "missions.practiceSleepHygiene",
      10,
    );
    const res = await app.inject({
      method: "POST",
      url: `/creature/missions/${mission.id}/claim`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it("claiming the same mission twice is rejected", async () => {
    const mission = await createMission("checkin", "missions.checkin", 10);
    await app.inject({
      method: "POST",
      url: "/creature/check-in",
      headers: { authorization: `Bearer ${token}` },
    });

    const first = await app.inject({
      method: "POST",
      url: `/creature/missions/${mission.id}/claim`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: "POST",
      url: `/creature/missions/${mission.id}/claim`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(second.statusCode).toBe(400);
  });

  it("claiming a mission levels up the creature at the XP threshold", async () => {
    const mission = await createMission("practice_breathing", "missions.practiceBreathing", 100);

    await prisma.creatureState.update({
      where: { userId },
      data: { experience: 95, level: 1 },
    });
    await prisma.practiceCompletion.create({
      data: { userId, source: "breathing", xpAwarded: 10 },
    });

    const res = await app.inject({
      method: "POST",
      url: `/creature/missions/${mission.id}/claim`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.leveledUp).toBe(true);
    expect(body.xpAwarded).toBe(100);

    const state = await prisma.creatureState.findUnique({ where: { userId } });
    expect(state?.level).toBe(2);
    expect(state?.experience).toBe(95);
  });
});
