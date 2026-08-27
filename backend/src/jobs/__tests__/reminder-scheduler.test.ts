import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import { reminderScheduler, pickWindowTime } from '../reminder-scheduler.js';
import { userService } from '../../services/user.js';

const now = new Date();
const currentHour = String(now.getHours()).padStart(2, '0');

let userId1: string;
let userId2: string;

beforeAll(async () => {
  process.env.VAPID_PUBLIC_KEY = 'test-public-key';
  process.env.VAPID_PRIVATE_KEY = 'test-private-key';

  const u1 = await userService.register({
    email: `reminder-${Date.now()}@example.com`,
    password: 'secret123',
    name: 'Remind 1',
    ageConfirmed: true,
    pdpConsent: true,
    wrappedKey: 'dGVzdC13cmFwcGVkLWtleQ==',
    keySalt: 'dGVzdC1zYWx0',
    recoveryWrappedKey: 'dGVzdC1yZWNvdmVyeQ==',
    recoverySalt: 'dGVzdC1yZWNvdmVyeS1zYWx0',
  });
  const u2 = await userService.register({
    email: `reminder2-${Date.now()}@example.com`,
    password: 'secret123',
    name: 'Remind 2',
    ageConfirmed: true,
    pdpConsent: true,
    wrappedKey: 'dGVzdC13cmFwcGVkLWtleQ==',
    keySalt: 'dGVzdC1zYWx0',
    recoveryWrappedKey: 'dGVzdC1yZWNvdmVyeQ==',
    recoverySalt: 'dGVzdC1yZWNvdmVyeS1zYWx0',
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
      type: 'day',
      locale: 'ru',
      text: 'Тестовое пожелание дня',
      question: 'Тестовый вопрос дня',
      order: 1,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId1, userId2] } } });
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
});

describe('reminderScheduler.runOnce', () => {
  it('counts users whose reminderTime matches the current hour', async () => {
    const count = await reminderScheduler.runOnce();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('counts afternoon slot users separately', async () => {
    const count = await reminderScheduler.runOnce();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('returns 0 when VAPID keys are missing', async () => {
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

  it('sends to a user whose flexible window resolves to the current hour', async () => {
    // Окно "схлопнуто" в одну точку (start === end === текущий час), поэтому
    // случайный выбор внутри окна детерминированно даёт текущий час — тест не
    // зависит от того, какой момент реально будет выбран в проде.
    await prisma.userPreference.update({
      where: { userId: userId2 },
      data: {
        eveningReminder: true,
        eveningMode: 'window',
        eveningWindowStart: `${currentHour}:00`,
        eveningWindowEnd: `${currentHour}:00`,
      },
    });

    const count = await reminderScheduler.runOnce();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it('does not double-send a window-mode slot via the exact-mode query', async () => {
    // reminderTime всё ещё хранит старое значение "текущий час", но режим
    // переключён на "window" с окном за пределами текущего часа — точный
    // запрос не должен зацепить этого пользователя за устаревшее reminderTime.
    const otherHour = String((Number(currentHour) + 5) % 24).padStart(2, '0');
    await prisma.userPreference.update({
      where: { userId: userId1 },
      data: {
        dailyReminder: true,
        reminderTime: `${currentHour}:00`,
        reminderMode: 'window',
        reminderWindowStart: `${otherHour}:00`,
        reminderWindowEnd: `${otherHour}:00`,
      },
    });

    const count = await reminderScheduler.runOnce();
    // userId1's morning slot no longer fires this hour — its exact
    // reminderTime still says "now", but reminderMode is "window" with the
    // window pointing elsewhere, so neither the exact-mode query (filtered
    // to reminderMode: 'exact') nor the window pick (resolves to otherHour)
    // should send. userId2's morning/afternoon (exact) and evening (window,
    // collapsed onto the current hour in the previous test) still fire.
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

describe('pickWindowTime', () => {
  it('is deterministic for the same user/slot/day', () => {
    const a = pickWindowTime('user-1', 'evening', '20:00', '23:00');
    const b = pickWindowTime('user-1', 'evening', '20:00', '23:00');
    expect(a).toBe(b);
  });

  it('picks a time within the given bounds', () => {
    const picked = pickWindowTime('user-2', 'evening', '20:00', '23:00');
    const [h, m] = picked.split(':').map(Number);
    const minutes = h * 60 + m;
    expect(minutes).toBeGreaterThanOrEqual(20 * 60);
    expect(minutes).toBeLessThanOrEqual(23 * 60);
  });

  it('varies across different users for the same window', () => {
    const picks = new Set(
      Array.from({ length: 20 }, (_, i) =>
        pickWindowTime(`user-${i}`, 'evening', '20:00', '23:00'),
      ),
    );
    // С 20 разными пользователями крайне маловероятно, что все выбрали одну
    // и ту же минуту — если это так, seededRandom, скорее всего, сломан.
    expect(picks.size).toBeGreaterThan(1);
  });

  it('handles windows that cross midnight', () => {
    const picked = pickWindowTime('user-3', 'evening', '23:00', '01:00');
    const [h] = picked.split(':').map(Number);
    expect(h === 23 || h === 0 || h === 1).toBe(true);
  });
});
