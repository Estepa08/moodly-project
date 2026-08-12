import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp, registerAndLogin } from '../../test/helpers.js';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { dyadKeysByLevel, DYADS } from '@moodly/shared';

let app: FastifyInstance;
let token: string;
let userId: string;
const prisma = new PrismaClient();

const PRIMARY_KEYS = dyadKeysByLevel(1);
const SECONDARY_KEYS = dyadKeysByLevel(2);

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, 'emotion-lab-test@example.com', 'secret123');
  token = result.token;
  userId = result.userId;
});

beforeEach(async () => {
  await prisma.emotionLabProgress.deleteMany({ where: { userId } });
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionTier: 'free', subscriptionExpiresAt: null },
  });
});

afterAll(async () => {
  await prisma.emotionLabProgress.deleteMany({ where: { userId } });
  await app.close();
  await prisma.$disconnect();
});

async function setDiscovered(keys: string[]) {
  await prisma.emotionLabProgress.upsert({
    where: { userId },
    create: { userId, discoveredDyads: keys },
    update: { discoveredDyads: keys },
  });
}

function getState() {
  return app.inject({
    method: 'GET',
    url: '/emotion-lab/state',
    headers: { authorization: `Bearer ${token}` },
  });
}

function attempt(emotionA: string, emotionB: string) {
  return app.inject({
    method: 'POST',
    url: '/emotion-lab/attempt',
    headers: { authorization: `Bearer ${token}` },
    payload: { emotionA, emotionB },
  });
}

describe('Emotion Lab', () => {
  it('GET /emotion-lab/state — initial state for a new user', async () => {
    const res = await getState();
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.discoveredDyads).toEqual([]);
    expect(body.discoveredCount).toBe(0);
    expect(body.totalDyads).toBe(28);
    expect(body.availableLevel).toBe(1);
    expect(body.tier).toBe('free');
    expect(body.dailyLimit).toBe(1);
    expect(body.attemptsUsed).toBe(0);
    expect(body.attemptsRemaining).toBe(1);
    expect(body.limitReached).toBe(false);
    expect(new Date(body.resetsAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('POST /emotion-lab/attempt — discovers a primary dyad (order-independent)', async () => {
    const res = await attempt('joy', 'trust');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.dyad.key).toBe('love');
    expect(body.dyad.level).toBe(1);
    expect(body.isNewDiscovery).toBe(true);
    expect(body.discoveredDyads).toEqual(['love']);
    expect(body.attemptsUsed).toBe(1);
    expect(body.attemptsRemaining).toBe(0);
  });

  it('POST /emotion-lab/attempt — reversed pair resolves to the same dyad', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'premium', subscriptionExpiresAt: null },
    });
    await attempt('trust', 'joy');
    const res = await attempt('joy', 'trust');
    expect(res.statusCode).toBe(200);
    expect(res.json().dyad.key).toBe('love');
    // Повторное открытие не засчитывается как новое.
    expect(res.json().isNewDiscovery).toBe(false);
    expect(res.json().discoveredCount).toBe(1);
  });

  it('POST /emotion-lab/attempt — rejects unknown emotion keys', async () => {
    const res = await attempt('joy', 'bliss');
    expect(res.statusCode).toBe(400);
  });

  it('POST /emotion-lab/attempt — rejects a pair that is not a dyad', async () => {
    const res = await attempt('joy', 'joy');
    expect(res.statusCode).toBe(400);
  });

  it('POST /emotion-lab/attempt — level 2 dyad is locked until all primaries discovered', async () => {
    const res = await attempt('joy', 'fear'); // guilt (level 2)
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('LEVEL_LOCKED');
  });

  it('GET /emotion-lab/state — availableLevel rises after all primaries', async () => {
    await setDiscovered(PRIMARY_KEYS);
    const res = await getState();
    expect(res.statusCode).toBe(200);
    expect(res.json().availableLevel).toBe(2);
  });

  it('POST /emotion-lab/attempt — level 2 dyad works after all primaries discovered', async () => {
    await setDiscovered(PRIMARY_KEYS);
    const res = await attempt('joy', 'fear');
    expect(res.statusCode).toBe(200);
    expect(res.json().dyad.key).toBe('guilt');
    expect(res.json().dyad.level).toBe(2);
    expect(res.json().availableLevel).toBe(2);
  });

  it('POST /emotion-lab/attempt — level 3 dyad is locked until all secondaries discovered', async () => {
    await setDiscovered([...PRIMARY_KEYS, ...SECONDARY_KEYS.slice(0, 7)]);
    const res = await attempt('joy', 'surprise'); // delight (level 3)
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('LEVEL_LOCKED');
  });

  it('POST /emotion-lab/attempt — level 4 dyad unlocks when both prerequisites discovered', async () => {
    // bittersweetness (joy+sadness) требует love и remorse.
    await setDiscovered(['love', 'remorse']);
    const res = await attempt('joy', 'sadness');
    expect(res.statusCode).toBe(200);
    expect(res.json().dyad.key).toBe('bittersweetness');
    expect(res.json().dyad.level).toBe(4);
  });

  it('POST /emotion-lab/attempt — level 4 dyad locked while a prerequisite is missing', async () => {
    await setDiscovered(['love']); // remorse ещё нет
    const res = await attempt('joy', 'sadness');
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('LEVEL_LOCKED');
  });

  it('POST /emotion-lab/attempt — free user hits the daily limit of 1', async () => {
    await attempt('joy', 'trust'); // love — 1-я попытка
    const res = await attempt('trust', 'fear'); // submission — 2-я попытка
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error).toBe('daily_limit_reached');
    expect(body.limit).toBe(1);
    expect(body.tier).toBe('free');
    expect(new Date(body.resetsAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('POST /emotion-lab/attempt — premium user has a limit of 5', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'premium', subscriptionExpiresAt: null },
    });
    const firstFive = DYADS.filter((d) => d.level === 1).slice(0, 5);
    for (const dyad of firstFive) {
      const res = await attempt(dyad.emotions[0], dyad.emotions[1]);
      expect(res.statusCode).toBe(200);
    }
    const res = await attempt('joy', 'trust');
    expect(res.statusCode).toBe(403);
    expect(res.json().limit).toBe(5);
    expect(res.json().tier).toBe('premium');
  });

  it('GET /emotion-lab/state — reports limit reached after exhausting attempts', async () => {
    await attempt('joy', 'trust');
    const res = await getState();
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.attemptsUsed).toBe(1);
    expect(body.attemptsRemaining).toBe(0);
    expect(body.limitReached).toBe(true);
  });

  it('POST /emotion-lab/attempt — requires authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/emotion-lab/attempt',
      payload: { emotionA: 'joy', emotionB: 'trust' },
    });
    expect(res.statusCode).toBe(401);
  });
});
