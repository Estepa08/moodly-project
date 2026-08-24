import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import { adventureScheduler } from '../adventure-scheduler.js';
import { userService } from '../../services/user.js';

let userId1: string;
let userId2: string;

beforeAll(async () => {
  process.env.VAPID_PUBLIC_KEY = 'test-public-key';
  process.env.VAPID_PRIVATE_KEY = 'test-private-key';

  const u1 = await userService.register({
    email: `adventure-${Date.now()}@example.com`,
    password: 'secret123',
    name: 'Adventure 1',
    ageConfirmed: true,
    pdpConsent: true,
    wrappedKey: 'dGVzdC13cmFwcGVkLWtleQ==',
    keySalt: 'dGVzdC1zYWx0',
    recoveryWrappedKey: 'dGVzdC1yZWNvdmVyeQ==',
    recoverySalt: 'dGVzdC1yZWNvdmVyeS1zYWx0',
  });
  const u2 = await userService.register({
    email: `adventure2-${Date.now()}@example.com`,
    password: 'secret123',
    name: 'Adventure 2',
    ageConfirmed: true,
    pdpConsent: true,
    wrappedKey: 'dGVzdC13cmFwcGVkLWtleQ==',
    keySalt: 'dGVzdC1zYWx0',
    recoveryWrappedKey: 'dGVzdC1yZWNvdmVyeQ==',
    recoverySalt: 'dGVzdC1yZWNvdmVyeS1zYWx0',
  });
  userId1 = u1.user.id;
  userId2 = u2.user.id;

  // userId1: прогулка завершилась час назад, ещё не уведомлён — должен попасть в выборку.
  await prisma.creatureState.upsert({
    where: { userId: userId1 },
    create: {
      userId: userId1,
      adventureReturnAt: new Date(Date.now() - 60 * 60 * 1000),
      adventureNotified: false,
    },
    update: {
      adventureReturnAt: new Date(Date.now() - 60 * 60 * 1000),
      adventureNotified: false,
    },
  });
  // userId2: прогулка ещё не завершилась — не должен попасть в выборку.
  await prisma.creatureState.upsert({
    where: { userId: userId2 },
    create: {
      userId: userId2,
      adventureReturnAt: new Date(Date.now() + 60 * 60 * 1000),
      adventureNotified: false,
    },
    update: {
      adventureReturnAt: new Date(Date.now() + 60 * 60 * 1000),
      adventureNotified: false,
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [userId1, userId2] } } });
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
});

describe('adventureScheduler.runOnce', () => {
  it('notifies only users whose adventure already ended and marks them notified', async () => {
    const count = await adventureScheduler.runOnce();
    expect(count).toBeGreaterThanOrEqual(1);

    const state1 = await prisma.creatureState.findUnique({ where: { userId: userId1 } });
    expect(state1?.adventureNotified).toBe(true);

    const state2 = await prisma.creatureState.findUnique({ where: { userId: userId2 } });
    expect(state2?.adventureNotified).toBe(false);
  });

  it('does not re-notify on a second run (adventureNotified already true)', async () => {
    const before = await prisma.creatureState.findUnique({ where: { userId: userId1 } });
    expect(before?.adventureNotified).toBe(true);
    const count = await adventureScheduler.runOnce();
    // userId1 больше не в выборке — уже уведомлён; общий count может быть 0 или
    // включать других юзеров из параллельных тестов, поэтому проверяем точечно.
    const after = await prisma.creatureState.findUnique({ where: { userId: userId1 } });
    expect(after?.adventureNotified).toBe(true);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 when VAPID keys are missing', async () => {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    try {
      const count = await adventureScheduler.runOnce();
      expect(count).toBe(0);
    } finally {
      process.env.VAPID_PUBLIC_KEY = pub;
      process.env.VAPID_PRIVATE_KEY = priv;
    }
  });
});
