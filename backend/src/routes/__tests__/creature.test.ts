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
    // stage не хранится в БД — только вычисляется от level (см. withStage() в
    // creature.ts). Раньше POST /creature/pet возвращал его пустым, и клиент
    // на секунду откатывал бейдж стадии на «Малыш» при оптимистичном
    // обновлении кэша (см. useCreature.ts usePet()).
    expect(res.json().state.stage).toBe('baby');
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

describe('Creature check-in — streak freeze', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('POST /creature/check-in — one missed day is covered by a freeze token', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-freeze@example.com',
      'secret123',
      'Freeze',
    );

    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: {
        streak: 5,
        streakFreezeCount: 1,
        lastCheckInAt: new Date(Date.now() - 2 * DAY_MS),
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().streakFreezeUsed).toBe(true);
    expect(res.json().state.streak).toBe(6);
    expect(res.json().state.streakFreezeCount).toBe(0);
  });

  it('POST /creature/check-in — one missed day without a token resets the streak', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-nofreeze@example.com',
      'secret123',
      'NoFreeze',
    );

    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: {
        streak: 5,
        streakFreezeCount: 0,
        lastCheckInAt: new Date(Date.now() - 2 * DAY_MS),
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().streakFreezeUsed).toBe(false);
    expect(res.json().state.streak).toBe(1);
  });
});

describe('Creature check-in — comeback tiers', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('POST /creature/check-in — a 7-day lapse fires the 7-day comeback tier', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-comeback7@example.com',
      'secret123',
      'Comeback7',
    );

    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: { lastCheckInAt: new Date(Date.now() - 8 * DAY_MS) },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().comebackDays).toBe(7);
    expect(res.json().state.streak).toBe(1);
  });

  it('POST /creature/check-in — a 30+ day lapse fires the 30-day comeback tier, not 7', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-comeback30@example.com',
      'secret123',
      'Comeback30',
    );

    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: { lastCheckInAt: new Date(Date.now() - 31 * DAY_MS) },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().comebackDays).toBe(30);
  });

  it('POST /creature/check-in — a normal next-day check-in fires no comeback tier', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-nocomeback@example.com',
      'secret123',
      'NoComeback',
    );

    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: { lastCheckInAt: new Date(Date.now() - 1 * DAY_MS) },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().comebackDays).toBeUndefined();
    expect(res.json().state.streak).toBe(2);
  });
});

// Session 7 (docs/plans/three-personas-design-gaps.md): companions must not
// punish pure passivity. Energy/comfort may only ever move via an explicit
// action (pet/practice/check-in reward) — never drop just because time
// passed without any activity. These tests pin that invariant down.
describe('Creature — no passive-inactivity penalty', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('GET /creature — reading state after a long idle gap does not lower stored energy/comfort', async () => {
    const user = await registerAndLogin(
      app,
      'creature-idle-read@example.com',
      'secret123',
      'IdleRead',
    );
    // CreatureState is created lazily on first access.
    await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: {
        energy: 40,
        comfort: 30,
        lastCheckInAt: new Date(Date.now() - 20 * DAY_MS),
        lastPetAt: new Date(Date.now() - 20 * DAY_MS),
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/creature',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    // Merely fetching state after being idle must not apply any decay.
    expect(res.json().energy).toBe(40);
    expect(res.json().comfort).toBe(30);
  });

  it('POST /creature/check-in — a long lapse never leaves energy/comfort below their prior values', async () => {
    const user = await registerAndLogin(
      app,
      'creature-idle-checkin@example.com',
      'secret123',
      'IdleCheckin',
    );
    // A first check-in creates the CreatureState row (lazily created).
    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: {
        energy: 10,
        comfort: 30,
        lastCheckInAt: new Date(Date.now() - 15 * DAY_MS),
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    // Check-in always recharges energy to full and only ever grows comfort
    // (comeback tiers add to it) — a missed period never pushes either
    // value down.
    expect(res.json().state.energy).toBe(100);
    expect(res.json().state.comfort).toBeGreaterThanOrEqual(30);
  });

  it('POST /creature/pet — a long pause before petting adds no extra energy/comfort penalty beyond the normal per-tap cost', async () => {
    const user = await registerAndLogin(
      app,
      'creature-idle-pet@example.com',
      'secret123',
      'IdlePet',
    );
    // A first tap creates the CreatureState row (lazily created).
    await app.inject({
      method: 'POST',
      url: '/creature/pet',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: {
        energy: 50,
        comfort: 20,
        lastPetAt: new Date(Date.now() - 30 * DAY_MS),
        petCount: 0,
      },
    });

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
    // Only the standard per-tap energy cost (-1 on the XP-awarding 3rd tap)
    // applies — the 30-day pause itself does not additionally drain energy,
    // and comfort (no empathy flag) is untouched.
    expect(res.json().state.energy).toBe(49);
    expect(res.json().state.comfort).toBe(20);
  });
});

describe('Creature check-in — companion adventure', () => {
  it('POST /creature/check-in — starts an adventure when none is active', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-adventure-start@example.com',
      'secret123',
      'AdventureStart',
    );

    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().state.adventureReturnAt).toBeTruthy();
    const returnAt = new Date(res.json().state.adventureReturnAt).getTime();
    expect(returnAt).toBeGreaterThan(Date.now());
  });

  it('POST /creature/check-in — does not restart an already-active adventure', async () => {
    const user = await registerAndLogin(
      app,
      'creature-checkin-adventure-keep@example.com',
      'secret123',
      'AdventureKeep',
    );

    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    const firstState = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    const firstReturnAt = firstState?.adventureReturnAt?.getTime();

    // Второй чек-ин через сутки не должен пересоздавать adventureReturnAt,
    // пока прогулка ещё активна.
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: { lastCheckInAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(new Date(res.json().state.adventureReturnAt).getTime()).toBe(firstReturnAt);
  });
});

describe('Creature adventure claim', () => {
  it('POST /creature/adventure/claim — 409 when the adventure has not finished yet', async () => {
    const user = await registerAndLogin(
      app,
      'creature-adventure-not-ready@example.com',
      'secret123',
      'NotReady',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/adventure/claim',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it('POST /creature/adventure/claim — 409 when there is no active adventure', async () => {
    const user = await registerAndLogin(
      app,
      'creature-adventure-none@example.com',
      'secret123',
      'NoAdventure',
    );

    const res = await app.inject({
      method: 'POST',
      url: '/creature/adventure/claim',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(res.statusCode).toBe(409);
  });

  it('POST /creature/adventure/claim — awards XP/comfort and clears adventureReturnAt once ready', async () => {
    const user = await registerAndLogin(
      app,
      'creature-adventure-ready@example.com',
      'secret123',
      'Ready',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/check-in',
      headers: { authorization: `Bearer ${user.token}` },
    });
    await prisma.creatureState.update({
      where: { userId: user.userId },
      data: { adventureReturnAt: new Date(Date.now() - 60 * 1000) },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/creature/adventure/claim',
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().xpAwarded).toBe(8);
    expect(res.json().comfortGain).toBe(3);
    expect(res.json().state.adventureReturnAt).toBeFalsy();

    // Повторный клейм без новой прогулки — снова 409.
    const second = await app.inject({
      method: 'POST',
      url: '/creature/adventure/claim',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(second.statusCode).toBe(409);
  });
});

describe('Creature reward — thoughtBattle (Тренажёр мысли)', () => {
  it('POST /creature/reward {source: "thoughtBattle"} — awards configured XP and energy', async () => {
    const user = await registerAndLogin(
      app,
      'creature-thoughtbattle@example.com',
      'secret123',
      'Battler',
    );

    const res = await app.inject({
      method: 'POST',
      url: '/creature/reward',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { source: 'thoughtBattle' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().state.experience).toBe(12);

    const completions = await app.inject({
      method: 'GET',
      url: '/creature/completions',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(completions.json()).toContainEqual(
      expect.objectContaining({ source: 'thoughtBattle', xpAwarded: 12 }),
    );
  });

  it('thoughtBattle completions count toward practice counters and the weekly calendar', async () => {
    const user = await registerAndLogin(
      app,
      'creature-thoughtbattle-count@example.com',
      'secret123',
      'BattlerCount',
    );
    await app.inject({
      method: 'POST',
      url: '/creature/reward',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { source: 'thoughtBattle' },
    });
    const stats = await app.inject({
      method: 'GET',
      url: '/creature/stats',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(stats.json().totalPractices).toBe(1);
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
