import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { reminderScheduler } from "../reminder-scheduler.js";
import { userService } from "../../services/user.js";

const now = new Date();
const currentHour = String(now.getHours()).padStart(2, "0");

let userId1: string;
let userId2: string;

beforeAll(async () => {
  process.env.VAPID_PUBLIC_KEY = "test-public-key";
  process.env.VAPID_PRIVATE_KEY = "test-private-key";

  const u1 = await userService.register({
    email: `reminder-${Date.now()}@example.com`,
    password: "secret123",
    name: "Remind 1",
    ageConfirmed: true,
    pdpConsent: true,
    wrappedKey: "dGVzdC13cmFwcGVkLWtleQ==",
    keySalt: "dGVzdC1zYWx0",
    recoveryWrappedKey: "dGVzdC1yZWNvdmVyeQ==",
    recoverySalt: "dGVzdC1yZWNvdmVyeS1zYWx0",
  });
  const u2 = await userService.register({
    email: `reminder2-${Date.now()}@example.com`,
    password: "secret123",
    name: "Remind 2",
    ageConfirmed: true,
    pdpConsent: true,
    wrappedKey: "dGVzdC13cmFwcGVkLWtleQ==",
    keySalt: "dGVzdC1zYWx0",
    recoveryWrappedKey: "dGVzdC1yZWNvdmVyeQ==",
    recoverySalt: "dGVzdC1yZWNvdmVyeS1zYWx0",
  });
  userId1 = u1.user.id;
  userId2 = u2.user.id;

  await prisma.userPreference.upsert({
    where: { userId: userId1 },
    create: { userId: userId1, dailyReminder: true, reminderTime: `${currentHour}:00` },
    update: { dailyReminder: true, reminderTime: `${currentHour}:00` },
  });
  await prisma.userPreference.upsert({
    where: { userId: userId2 },
    create: { userId: userId2, dailyReminder: true, reminderTime: `${currentHour}:00` },
    update: { dailyReminder: true, reminderTime: `${currentHour}:00` },
  });
  await prisma.userPreference.upsert({
    where: { userId: userId2 },
    create: { userId: userId2, afternoonReminder: true, afternoonTime: `${currentHour}:00` },
    update: { afternoonReminder: true, afternoonTime: `${currentHour}:00` },
  });
  await prisma.motivationMessage.create({
    data: {
      type: "day",
      locale: "ru",
      text: "Тестовое пожелание дня",
      question: "Тестовый вопрос дня",
      order: 1,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId1, userId2] } } });
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
});

describe("reminderScheduler.runOnce", () => {
  it("counts users whose reminderTime matches the current hour", async () => {
    const count = await reminderScheduler.runOnce();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("counts afternoon slot users separately", async () => {
    const count = await reminderScheduler.runOnce();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("returns 0 when VAPID keys are missing", async () => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    try {
      const count = await reminderScheduler.runOnce();
      expect(count).toBe(0);
    } finally {
      process.env.VAPID_PUBLIC_KEY = pub;
      process.env.VAPID_PRIVATE_KEY = priv;
    }
  });
});
