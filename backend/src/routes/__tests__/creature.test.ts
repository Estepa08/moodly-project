import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { buildApp, registerAndLogin } from '../../test/helpers.js';
import { prisma } from '../../lib/prisma.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;

beforeAll(async () => {
  app = await buildApp();
  const result = await registerAndLogin(app, 'creature-test@example.com', 'secret123', 'Creature');
  token = result.token;
});

afterAll(async () => {
  await app.close();
});

describe('Creature pets', () => {
  it('GET /creature/pets — returns default starter collection', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/creature/pets',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      unlockedPetTypes: ['puff', 'fox'],
      activePetType: 'puff',
      petName: null,
    });
  });

  it('PATCH /creature/pet — unlocks a starter pet and sets the name', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${token}` },
      payload: { petType: 'sloth', petName: 'Ленивец' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      unlockedPetTypes: ['puff', 'fox', 'sloth'],
      activePetType: 'sloth',
      petName: 'Ленивец',
    });
  });

  it('PATCH /creature/pet — name only update keeps the pet type', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${token}` },
      payload: { petName: 'Дружок' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ activePetType: 'sloth', petName: 'Дружок' });
  });

  it('PATCH /creature/pet — rejects a non-starter locked pet', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${token}` },
      payload: { petType: 'giraffe' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('PATCH /creature/pet — empty petType and no petName is rejected', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /creature — state includes petName', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().petName).toBe('Дружок');
  });
});

describe('Creature petting (cycle 1-2-3 + energy)', () => {
  // Фиксируем время вне окон бонусов (6-12 и 20-23), чтобы базовый цикл
  // не зависел от реального часа запуска тестов.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('POST /creature/pet — 1st tap: no XP, cyclePosition 1', async () => {
    const user = await registerAndLogin(
      app,
      'creature-pet-first@example.com',
      'secret123',
      'Petter',
    );
    const res = await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 0,
      petCount: 1,
      cyclePosition: 1,
      limitReached: false,
    });
    expect(res.json().state.petCount).toBe(1);
    expect(res.json().state.energy).toBe(100);
  });

  it('POST /creature/pet — 2nd tap: no XP, cyclePosition 2', async () => {
    const user = await registerAndLogin(
      app,
      'creature-pet-second@example.com',
      'secret123',
      'Second',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 0,
      petCount: 2,
      cyclePosition: 2,
    });
    expect(res.json().state.energy).toBe(100);
  });

  it('POST /creature/pet — 3rd tap: +1 XP, −1 energy, cyclePosition 3', async () => {
    const user = await registerAndLogin(
      app,
      'creature-pet-third@example.com',
      'secret123',
      'Third',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 1,
      petCount: 3,
      cyclePosition: 3,
    });
    expect(res.json().state.energy).toBe(99);
  });

  it('GET /creature — reports remaining petting for the day', async () => {
    const user = await registerAndLogin(
      app,
      'creature-pet-state@example.com',
      'secret123',
      'State',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().petCount).toBe(1);
    expect(res.json().petCountRemaining).toBe(299);
  });

  it('POST /creature/pet — stops awarding XP after the daily limit', async () => {
    const user = await registerAndLogin(
      app,
      'creature-pet-limit@example.com',
      'secret123',
      'Limit',
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { petCount: 300, lastPetAt: today },
      create: { userId: user.userId, petCount: 300, lastPetAt: today },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 0,
      petCount: 300,
      petCountRemaining: 0,
      limitReached: true,
    });
  });

  it('POST /creature/pet — counter resets on a new day (first click after overnight pause = welcome +2 XP)', async () => {
    const user = await registerAndLogin(
      app,
      'creature-pet-reset@example.com',
      'secret123',
      'Reset',
    );
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { petCount: 300, lastPetAt: yesterday },
      create: { userId: user.userId, petCount: 300, lastPetAt: yesterday },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 2,
      petCount: 1,
      cyclePosition: 1,
      limitReached: false,
      bonus: { welcome: true },
    });
  });

  it('POST /creature/pet — 3rd tap with 0 energy awards no XP and keeps energy 0', async () => {
    const user = await registerAndLogin(
      app,
      'creature-pet-noenergy@example.com',
      'secret123',
      'Tired',
    );
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { energy: 0, petCount: 2, lastPetAt: new Date() },
      create: { userId: user.userId, energy: 0, petCount: 2, lastPetAt: new Date() },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 0,
      cyclePosition: 3,
    });
    expect(res.json().state.energy).toBe(0);
  });
});

describe('Creature pet bonuses (morning / evening / combo / welcome / empathy)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const tap = (user: { token: string }, payload?: { empathy?: boolean }) =>
    app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
      payload,
    });

  it('morning window (6-12): 3rd tap awards +2 XP', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 8, 30, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-morning@example.com',
      'secret123',
      'Morning',
    );
    await tap(user);
    await tap(user);
    const res = await tap(user);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 2,
      cyclePosition: 3,
      bonus: { morning: true, evening: false, welcome: false, empathy: false },
    });
  });

  it('evening window (20-23): 3rd tap awards +1 XP and +1 calmness', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 21, 0, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-evening@example.com',
      'secret123',
      'Evening',
    );
    await tap(user);
    await tap(user);
    const res = await tap(user);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 1,
      cyclePosition: 3,
      calmnessGain: 1,
      bonus: { morning: false, evening: true, welcome: false, empathy: false },
    });
    expect(res.json().state.calmness).toBe(51);
  });

  it('welcome: after a pause > 4h the first 3 taps award +2 XP each', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-welcome@example.com',
      'secret123',
      'Welcome',
    );
    const pausedAt = new Date(2026, 5, 15, 10, 0, 0);
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { lastPetAt: pausedAt, welcomeUsed: 0, petCount: 0 },
      create: { userId: user.userId, lastPetAt: pausedAt, welcomeUsed: 0, petCount: 0 },
    });

    for (let i = 1; i <= 3; i++) {
      const res = await tap(user);
      expect(res.json()).toMatchObject({ xpAwarded: 2, bonus: { welcome: true } });
      expect(res.json().petCount).toBe(i);
    }

    const fourth = await tap(user);
    expect(fourth.json()).toMatchObject({ xpAwarded: 0, bonus: { welcome: false } });
  });

  it('welcome: a brand-new account (no lastPetAt) does NOT trigger the bonus', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-welcome-new@example.com',
      'secret123',
      'Newbie',
    );
    const first = await tap(user);
    expect(first.json()).toMatchObject({ xpAwarded: 0, bonus: { welcome: false } });
  });

  it('combo: 5 quick taps award +3 XP on the 5th tap', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-combo@example.com',
      'secret123',
      'Combo',
    );
    let res!: Awaited<ReturnType<typeof tap>>;
    for (let i = 1; i <= 5; i++) {
      res = await tap(user);
    }
    expect(res.json()).toMatchObject({
      comboCount: 5,
      comboBonusAwarded: true,
      xpAwarded: 3,
    });
  });

  it('combo: a gap over 0.5s breaks the streak (no bonus)', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-combo-gap@example.com',
      'secret123',
      'Gap',
    );
    for (let i = 1; i <= 4; i++) {
      await tap(user);
    }
    // Пауза 1 секунда между кликами.
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 1));
    const res = await tap(user);
    expect(res.json()).toMatchObject({
      comboCount: 1,
      comboBonusAwarded: false,
    });
  });

  it('combo: no XP at the daily limit (fast taps bypass the limit)', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-combo-limit@example.com',
      'secret123',
      'Limit',
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { petCount: 300, lastPetAt: today },
      create: { userId: user.userId, petCount: 300, lastPetAt: today },
    });

    let res!: Awaited<ReturnType<typeof tap>>;
    for (let i = 1; i <= 5; i++) {
      res = await tap(user);
    }
    expect(res.json()).toMatchObject({
      comboCount: 0,
      comboBonusAwarded: false,
      xpAwarded: 0,
      limitReached: true,
    });
  });

  it('empathy: 3rd tap with empathy flag awards +1 XP and +2 comfort', async () => {
    vi.setSystemTime(new Date(2026, 5, 15, 15, 0, 0));
    const user = await registerAndLogin(
      app,
      'creature-bonus-empathy@example.com',
      'secret123',
      'Empathy',
    );
    await tap(user);
    await tap(user);
    const res = await tap(user, { empathy: true });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 1,
      comfortGain: 2,
      bonus: { empathy: true },
    });
    expect(res.json().state.comfort).toBe(2);
  });

  it('GET /creature — state and stats include comfort', async () => {
    const user = await registerAndLogin(
      app,
      'creature-comfort-state@example.com',
      'secret123',
      'Comfort',
    );
    const state = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(state.json().comfort).toBe(0);
    const stats = await app.inject({
      method: 'GET',
      url: '/creature/stats',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(stats.json().comfort).toBe(0);
  });
});

describe('Creature mood and stage', () => {
  it('GET /creature — returns default petMood and stage', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().petMood).toBe('calm');
    expect(res.json().stage).toBe('baby');
  });

  it('GET /creature — petMood comes from creatureState (client-computed under E2E)', async () => {
    const user = await registerAndLogin(
      app,
      'creature-mood-high@example.com',
      'secret123',
      'Happy',
    );
    const push = await app.inject({
      method: 'POST',
      url: '/sync/push',
      headers: { authorization: `Bearer ${user.token}` },
      payload: {
        actions: [
          {
            entity: 'creatureState',
            action: 'upsert',
            id: 'creature-profile',
            occurredAt: new Date().toISOString(),
            payload: { petMood: 'happy', calmness: 80 },
          },
        ],
      },
    });
    expect(push.statusCode).toBe(200);

    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().petMood).toBe('happy');
  });

  it('GET /creature — petMood falls back to calm when not pushed', async () => {
    const user = await registerAndLogin(app, 'creature-mood-low@example.com', 'secret123', 'Low');
    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().petMood).toBe('calm');
  });

  it('GET /creature — stage grows with level', async () => {
    const user = await registerAndLogin(app, 'creature-stage@example.com', 'secret123', 'Stage');
    await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    const state = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    await prisma.creatureState.update({ where: { id: state!.id }, data: { level: 12 } });
    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().stage).toBe('adult');
  });
});

describe('Creature feed', () => {
  it('POST /creature/feed — increments feed counter for the active pet and awards +1 XP', async () => {
    const user = await registerAndLogin(app, 'creature-feed@example.com', 'secret123', 'Feeder');
    await app.inject({
      method: 'PATCH',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { petType: 'sloth' },
    });

    const first = await app.inject({
      method: 'POST',
      url: '/creature/feed',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      xpAwarded: 1,
      feedCount: 1,
      feedCounts: { sloth: 1 },
    });

    const second = await app.inject({
      method: 'POST',
      url: '/creature/feed',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(second.json()).toMatchObject({
      feedCount: 2,
      feedCounts: { sloth: 2 },
    });
    expect(second.json().state.experience).toBeGreaterThan(first.json().state.experience);
  });

  it('POST /creature/feed — stops awarding XP after the daily limit', async () => {
    const user = await registerAndLogin(
      app,
      'creature-feed-limit@example.com',
      'secret123',
      'Limit',
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.practiceCompletion.createMany({
      data: Array.from({ length: 50 }, () => ({
        userId: user.userId,
        source: 'feed',
        xpAwarded: 1,
        createdAt: today,
      })),
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/feed',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().xpAwarded).toBe(0);
    expect(res.json().feedCount).toBe(1);
    expect(res.json().feedCounts.puff).toBe(1);
  });

  it('GET /creature/stats — includes feedCount and feedCounts', async () => {
    const user = await registerAndLogin(
      app,
      'creature-feed-stats@example.com',
      'secret123',
      'Stats',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/feed',
      headers: { authorization: `Bearer ${user.token}` },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/creature/stats',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().feedCount).toBe(1);
    expect(res.json().feedCounts).toMatchObject({ puff: 1 });
  });

  it('GET /creature/pets — includes feedCounts', async () => {
    const user = await registerAndLogin(app, 'creature-feed-pets@example.com', 'secret123', 'Pets');
    const res = await app.inject({
      method: 'GET',
      url: '/creature/pets',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ unlockedPetTypes: ['puff', 'fox'], activePetType: 'puff' });
    expect(res.json().feedCounts).toBeDefined();
  });

  it('feed completions are excluded from practice counters', async () => {
    const user = await registerAndLogin(
      app,
      'creature-feed-exclude@example.com',
      'secret123',
      'Excl',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/feed',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await app.inject({
      method: 'POST',
      url: '/creature/reward',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { source: 'gratitude' },
    });
    const res = await app.inject({
      method: 'GET',
      url: '/creature/stats',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().totalPractices).toBe(1);
    expect(res.json().sourceBreakdown).toEqual({ gratitude: 1 });
  });
});

describe('Creature energy restoration', () => {
  it('POST /creature/reward — gratitude restores +15 energy', async () => {
    const user = await registerAndLogin(
      app,
      'creature-energy-gratitude@example.com',
      'secret123',
      'Restore',
    );
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { energy: 50 },
      create: { userId: user.userId, energy: 50 },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/reward',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { source: 'gratitude' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().state.energy).toBe(65);
  });

  it('POST /creature/reward — breathing restores +25 energy', async () => {
    const user = await registerAndLogin(
      app,
      'creature-energy-breathing@example.com',
      'secret123',
      'Breathe',
    );
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { energy: 40 },
      create: { userId: user.userId, energy: 40 },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/reward',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { source: 'breathing' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().state.energy).toBe(65);
  });

  it('POST /creature/exercise/complete — restores energy and clamps to 100', async () => {
    const user = await registerAndLogin(
      app,
      'creature-energy-clamp@example.com',
      'secret123',
      'Clamp',
    );
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      update: { energy: 90 },
      create: { userId: user.userId, energy: 90 },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/exercise/complete',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { duration: 60 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().state.energy).toBe(100);
  });
});

describe('Creature check-in — race safety', () => {
  it('POST /creature/check-in — concurrent check-ins award only once', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-race@example.com',
      'secret123',
      'Race',
    );

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        app.inject({
          method: 'POST',
          url: '/creature/check-in',
          headers: { authorization: `Bearer ${user.token}` },
        }),
      ),
    );

    const ok = results.filter((r) => r.statusCode === 200);
    const conflicted = results.filter((r) => r.statusCode === 409);
    expect(ok.length).toBe(1);
    expect(conflicted.length).toBe(4);

    const completionCount = await prisma.practiceCompletion.count({
      where: { userId: user.userId, source: 'checkin' },
    });
    expect(completionCount).toBe(1);

    const state = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    expect(state?.streak).toBe(1);
  });
});

describe('Creature play (A1 — energy revival)', () => {
  it('POST /creature/play — costs 10 energy, awards +2 XP, increments playCount', async () => {
    const user = await registerAndLogin(app, 'creature-play@example.com', 'secret123', 'Player');

    const res = await app.inject({
      method: 'POST',
      url: '/creature/play',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      xpAwarded: 2,
      playCount: 1,
      playDailyLimit: 3,
      playCountRemaining: 2,
    });
    expect(res.json().state.energy).toBe(90);
  });

  it('POST /creature/play — free tier: rejects once the daily play limit (3) is reached', async () => {
    const user = await registerAndLogin(
      app,
      'creature-play-limit@example.com',
      'secret123',
      'PlayLimit',
    );
    for (let i = 0; i < 3; i++) {
      const ok = await app.inject({
        method: 'POST',
        url: '/creature/play',
        headers: { authorization: `Bearer ${user.token}` },
      });
      expect(ok.statusCode).toBe(200);
    }
    const res = await app.inject({
      method: 'POST',
      url: '/creature/play',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /creature/play — active premium tier gets 5 plays/day instead of 3', async () => {
    const user = await registerAndLogin(
      app,
      'creature-play-premium@example.com',
      'secret123',
      'Premium',
    );
    await prisma.user.update({
      where: { id: user.userId },
      data: { subscriptionTier: 'premium', subscriptionExpiresAt: null },
    });

    for (let i = 0; i < 5; i++) {
      const ok = await app.inject({
        method: 'POST',
        url: '/creature/play',
        headers: { authorization: `Bearer ${user.token}` },
      });
      expect(ok.statusCode).toBe(200);
      expect(ok.json().playDailyLimit).toBe(5);
    }
    const res = await app.inject({
      method: 'POST',
      url: '/creature/play',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /creature/play — expired premium falls back to the free tier limit (3)', async () => {
    const user = await registerAndLogin(
      app,
      'creature-play-expired@example.com',
      'secret123',
      'Expired',
    );
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await prisma.user.update({
      where: { id: user.userId },
      data: { subscriptionTier: 'premium', subscriptionExpiresAt: yesterday },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/play',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.json().playDailyLimit).toBe(3);
  });

  it('POST /creature/play — rejects when energy is below the play cost', async () => {
    const user = await registerAndLogin(
      app,
      'creature-play-noenergy@example.com',
      'secret123',
      'NoEnergy',
    );
    await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: { energy: 5 },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/creature/play',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /creature — reports playDailyLimit/playCountRemaining for the free tier', async () => {
    const user = await registerAndLogin(
      app,
      'creature-play-state@example.com',
      'secret123',
      'PlayState',
    );
    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      playCount: 0,
      playDailyLimit: 3,
      playCountRemaining: 3,
    });
  });

  it('play completions are excluded from practice counters and weekly calendar', async () => {
    const user = await registerAndLogin(
      app,
      'creature-play-exclude@example.com',
      'secret123',
      'PlayExcl',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/play',
      headers: { authorization: `Bearer ${user.token}` },
    });
    const stats = await app.inject({
      method: 'GET',
      url: '/creature/stats',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(stats.json().totalPractices).toBe(0);

    const weekly = await app.inject({
      method: 'GET',
      url: '/creature/weekly',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(weekly.json().completedCount).toBe(0);
  });
});

describe('Creature weekly calendar (C2)', () => {
  it('GET /creature/weekly — 7 Mon..Sun days, goal reached after 5 distinct practice days', async () => {
    const user = await registerAndLogin(app, 'creature-weekly@example.com', 'secret123', 'Weekly');
    const monday = new Date();
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(10, 0, 0, 0);

    await prisma.practiceCompletion.createMany({
      data: Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return { userId: user.userId, source: 'gratitude', xpAwarded: 5, createdAt: d };
      }),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/creature/weekly',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.days).toHaveLength(7);
    expect(body.completedCount).toBe(5);
    expect(body.goal).toBe(5);
    expect(body.goalReached).toBe(true);
    expect(body.claimed).toBe(false);
  });

  it('POST /creature/weekly/claim — rejects when goal not reached', async () => {
    const user = await registerAndLogin(
      app,
      'creature-weekly-notyet@example.com',
      'secret123',
      'NotYet',
    );
    const res = await app.inject({
      method: 'POST',
      url: '/creature/weekly/claim',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /creature/weekly/claim — awards +25 XP once, second claim in the same week is rejected', async () => {
    const user = await registerAndLogin(
      app,
      'creature-weekly-claim@example.com',
      'secret123',
      'Claimer',
    );
    const monday = new Date();
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    monday.setHours(10, 0, 0, 0);

    await prisma.practiceCompletion.createMany({
      data: Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return { userId: user.userId, source: 'gratitude', xpAwarded: 5, createdAt: d };
      }),
    });

    const first = await app.inject({
      method: 'POST',
      url: '/creature/weekly/claim',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({ claimed: true, xpAwarded: 25 });

    const after = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    expect(after?.weeklyClaimWeek).toBeTruthy();

    const second = await app.inject({
      method: 'POST',
      url: '/creature/weekly/claim',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(second.statusCode).toBe(409);
  });
});
