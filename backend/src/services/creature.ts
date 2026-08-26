import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { lockUser } from '../lib/user-lock.js';
import { achievementsService } from './achievements.js';
import {
  applyLevelUp,
  stageForLevel,
  selectDailyMissions,
  PRACTICE_XP,
  CHECKIN_EXP,
  EXERCISE_EXP,
  MAX_ENERGY,
  MOOD_ENTRY_XP,
  MOOD_ENTRY_DAILY_LIMIT,
  FEED_XP,
  FEED_XP_DAILY_LIMIT,
  PET_XP,
  PET_CYCLE,
  PET_ENERGY_COST,
  PET_DAILY_CLICK_LIMIT,
  PRACTICE_ENERGY_REWARD,
  STARTER_PET_TYPES,
  MS_PER_DAY,
  MORNING_XP,
  EVENING_CALMNESS_GAIN,
  COMBO_XP,
  COMBO_THRESHOLD,
  COMBO_WINDOW_MS,
  PET_TIMES_BUFFER,
  WELCOME_XP,
  WELCOME_CLICK_COUNT,
  WELCOME_PAUSE_HOURS,
  EMPATHY_COMFORT_GAIN,
  isMorningWindow,
  isEveningWindow,
  computeComboCount,
  comebackTierForGap,
  WEEKLY_GOAL_DAYS,
  WEEKLY_XP_REWARD,
  WEEKLY_EXCLUDED_SOURCES,
  dateKey,
  mondayOfWeek,
  weekKey,
  ADVENTURE_DURATION_HOURS,
  ADVENTURE_XP,
  ADVENTURE_COMFORT_GAIN,
} from '@moodly/shared';

type CreatureClient = typeof prisma | Prisma.TransactionClient;

// Повторено 7 раз по всему сервису (getState/claimMission/checkIn/
// claimAdventureReturn/play/pet/claimWeekly): CreatureState создаётся
// лениво при первом обращении, а не при регистрации, поэтому каждая
// мутация начинает с "найти-или-создать" с одним и тем же дефолтом.
async function getOrCreateCreatureState(client: CreatureClient, userId: string) {
  const state = await client.creatureState.findUnique({ where: { userId } });
  if (state) return state;
  return client.creatureState.create({ data: { userId, calmness: 50 } });
}

export const creatureService = {
  async getState(userId: string) {
    const state = await getOrCreateCreatureState(prisma, userId);
    const sessionCount = await prisma.breathingSession.count({ where: { userId } });
    const energy = state.energy ?? 100;
    const level = state.level ?? 1;
    // E2E: настроение питомца считает клиент (сервер не видит entry.value).
    // Fallback для старых аккаунтов без значения.
    const petMood = (state.petMood ?? (state.calmness ?? 50) >= 70) ? 'happy' : 'calm';
    const petSummary = this._petSummary(state);
    return {
      ...state,
      petCount: petSummary.petCountToday,
      petCountRemaining: petSummary.petCountRemaining,
      energy,
      level,
      experience: state.experience ?? 0,
      streak: state.streak ?? 0,
      sessionCount,
      petMood,
      stage: stageForLevel(level),
    };
  },

  // Поглаживания считаются за сутки по серверному времени: если последнее
  // поглаживание было вчера — сегодняшний счётчик считается нулевым.
  // Лимит в кликах: XP даёт только каждый 3-й клик, поэтому дневной лимит
  // кликов = PET_DAILY_CLICK_LIMIT (300), а не 100.
  _petSummary(state: { lastPetAt?: Date | null; petCount?: number | null }): {
    petCountToday: number;
    petCountRemaining: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastPet = state.lastPetAt ? new Date(state.lastPetAt) : null;
    let petCountToday = 0;
    if (lastPet) {
      const lastPetDate = new Date(lastPet);
      lastPetDate.setHours(0, 0, 0, 0);
      if (lastPetDate.getTime() === today.getTime()) {
        petCountToday = state.petCount ?? 0;
      }
    }
    return {
      petCountToday,
      petCountRemaining: Math.max(0, PET_DAILY_CLICK_LIMIT - petCountToday),
    };
  },

  async getStats(userId: string) {
    const creature = await this.getState(userId);
    const completions = await prisma.practiceCompletion.findMany({
      where: { userId },
      select: { source: true, xpAwarded: true, createdAt: true },
    });
    const practiceCompletions = completions.filter(
      (c) => c.source !== 'moodEntry' && c.source !== 'feed' && c.source !== 'play',
    );
    const totalXp = completions.reduce((sum, c) => sum + c.xpAwarded, 0);
    const totalPractices = practiceCompletions.length;
    const totalCheckins = await prisma.practiceCompletion.count({
      where: { userId, source: 'checkin' },
    });
    const firstActivity =
      practiceCompletions.length > 0
        ? practiceCompletions[practiceCompletions.length - 1].createdAt
        : null;
    const daysSinceFirst = firstActivity
      ? Math.max(1, Math.floor((Date.now() - firstActivity.getTime()) / MS_PER_DAY))
      : 0;

    const sourceBreakdown: Record<string, number> = {};
    for (const c of practiceCompletions) {
      sourceBreakdown[c.source as string] = (sourceBreakdown[c.source as string] ?? 0) + 1;
    }

    return {
      totalXp: totalXp + creature.experience,
      totalEarnedXp: totalXp,
      totalPractices,
      totalCheckins,
      daysSinceFirst,
      level: creature.level,
      streak: creature.streak,
      calmness: creature.calmness,
      comfort: creature.comfort ?? 0,
      energy: creature.energy,
      sourceBreakdown,
      feedCount: creature.feedCount ?? 0,
      feedCounts: (creature.feedCounts as Record<string, number>) ?? {},
    };
  },

  async getPets(userId: string) {
    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    if (!creature) {
      return {
        unlockedPetTypes: ['puff', 'fox'],
        activePetType: 'puff',
        petName: null,
        feedCounts: {},
      };
    }
    return {
      unlockedPetTypes: creature.unlockedPetTypes ?? ['puff', 'fox'],
      activePetType: creature.petType ?? 'puff',
      petName: creature.petName ?? null,
      feedCounts: (creature.feedCounts as Record<string, number>) ?? {},
    };
  },

  async setPet(userId: string, petType?: string, petName?: string | null) {
    const creature = await this.getState(userId);

    if (petType === undefined && petName === undefined) {
      throw new AppError('BAD_REQUEST', 400, 'petType or petName is required');
    }

    const data: Record<string, unknown> = {};
    if (petType !== undefined) {
      const unlocked = creature.unlockedPetTypes ?? ['puff', 'fox'];
      if (!unlocked.includes(petType)) {
        if (STARTER_PET_TYPES.includes(petType)) {
          data.unlockedPetTypes = [...unlocked, petType];
        } else {
          throw new AppError('LOCKED', 403, 'Pet type not unlocked');
        }
      }
      data.petType = petType;
    }
    if (petName !== undefined) {
      const trimmed = petName?.trim() || null;
      data.petName = trimmed;
    }

    const updated = await prisma.creatureState.update({
      where: { userId },
      data,
    });
    return {
      unlockedPetTypes: updated.unlockedPetTypes ?? ['puff', 'fox'],
      activePetType: updated.petType ?? 'puff',
      petName: updated.petName ?? null,
    };
  },

  async getHeatmap(userId: string, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const completions = await prisma.practiceCompletion.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const completionsByDate = new Map<string, number>();
    for (const completion of completions) {
      const dateKey = completion.createdAt.toISOString().slice(0, 10);
      completionsByDate.set(dateKey, (completionsByDate.get(dateKey) ?? 0) + 1);
    }

    const result: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(since);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      result.push({ date: key, count: completionsByDate.get(key) ?? 0 });
    }

    return result;
  },

  async getMissions(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const existingMissions = await prisma.dailyMission.findMany({
      where: {
        userId,
        date: { gte: today, lt: todayEnd },
      },
    });

    if (existingMissions.length > 0) {
      return this._evaluateMissions(userId, existingMissions);
    }

    const selected = selectDailyMissions(userId, today, 3);

    const created = await Promise.all(
      selected.map((m) =>
        prisma.dailyMission.create({
          data: {
            userId,
            date: today,
            missionKey: m.missionKey,
            labelKey: m.labelKey,
            xpReward: m.xpReward,
            sortOrder: m.sortOrder,
          },
        }),
      ),
    );

    return this._evaluateMissions(userId, created);
  },

  async _evaluateMissions(
    userId: string,
    missions: Awaited<ReturnType<typeof prisma.dailyMission.findMany>>,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayCompletions = (
      await prisma.practiceCompletion.findMany({
        where: { userId, createdAt: { gte: today, lt: todayEnd } },
        select: { source: true },
      })
    ).filter((c) => c.source !== 'moodEntry' && c.source !== 'feed' && c.source !== 'play');
    const todayEntries = await prisma.entry.count({
      where: { userId, createdAt: { gte: today, lt: todayEnd } },
    });
    const todayDayActivities = await prisma.entry.count({
      where: {
        userId,
        createdAt: { gte: today, lt: todayEnd },
        parameter: { name: 'Day Activities' },
      },
    });
    const todayTests = await prisma.testResult.count({
      where: { userId, completedAt: { gte: today, lt: todayEnd } },
    });
    const creature = await prisma.creatureState.findUnique({ where: { userId } });

    const completedSources = new Set(todayCompletions.map((c) => c.source));
    const breathingCount = todayCompletions.filter((c) => c.source === 'breathing').length;

    const MISSION_SOURCE: Record<string, string> = {
      checkin: 'checkin',
      practice_breathing: 'breathing',
      practice_gratitude: 'gratitude',
      practice_sleepHygiene: 'sleepHygiene',
      practice_distortions: 'distortions',
      practice_cba: 'cba',
      practice_thoughtJournal: 'thoughtJournal',
    };

    return missions.map((m) => {
      let progress = 0;

      if (m.missionKey === 'complete_3_practices') {
        progress = Math.min(3, todayCompletions.length) / 3;
      } else if (m.missionKey === 'complete_5_practices') {
        progress = Math.min(5, todayCompletions.length) / 5;
      } else if (m.missionKey === 'log_mood_entry') {
        progress = todayEntries > 0 ? 1 : 0;
      } else if (m.missionKey === 'log_3_mood_entries') {
        progress = Math.min(3, todayEntries) / 3;
      } else if (m.missionKey === 'complete_test') {
        progress = todayTests > 0 ? 1 : 0;
      } else if (m.missionKey === 'breathing_2') {
        progress = Math.min(2, breathingCount) / 2;
      } else if (m.missionKey === 'streak_2') {
        progress = (creature?.streak ?? 0) >= 2 ? 1 : 0;
      } else if (m.missionKey === 'log_day_activities') {
        progress = todayDayActivities > 0 ? 1 : 0;
      } else {
        const source = MISSION_SOURCE[m.missionKey];
        progress = source && completedSources.has(source) ? 1 : 0;
      }

      return {
        id: m.id,
        missionKey: m.missionKey,
        labelKey: m.labelKey,
        xpReward: m.xpReward,
        progress: Math.min(1, progress),
        claimed: m.claimed,
        sortOrder: m.sortOrder,
      };
    });
  },

  async claimMission(userId: string, missionId: string) {
    // Вся операция (проверка claimed + начисление XP) в транзакции с
    // блокировкой User: параллельный claim не даст двойного начисления.
    return prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const mission = await tx.dailyMission.findUnique({ where: { id: missionId } });
      if (!mission || mission.userId !== userId) {
        throw new AppError('NOT_FOUND', 404, 'Mission not found');
      }
      if (mission.claimed) {
        throw new AppError('ALREADY_CLAIMED', 409, 'Mission already claimed');
      }

      const evaluated = await this.getMissions(userId);
      const match = evaluated.find((m) => m.id === missionId);
      if (!match || match.progress < 1) {
        throw new AppError('NOT_COMPLETED', 400, 'Mission not yet completed');
      }

      const state = await getOrCreateCreatureState(tx, userId);
      const { experience, level, leveledUp } = applyLevelUp(state, mission.xpReward);

      await Promise.all([
        tx.dailyMission.update({
          where: { id: missionId },
          data: { claimed: true },
        }),
        tx.creatureState.update({
          where: { userId },
          data: { experience, level },
        }),
      ]);

      return { claimed: true, xpAwarded: mission.xpReward, leveledUp };
    });
  },

  async completeExercise(userId: string, duration: number) {
    const state = await this.getState(userId);
    const initialCalmness = state.calmness;
    const gain = Math.min(Math.floor(duration / 6), 40);
    const finalCalmness = Math.min(100, initialCalmness + gain);
    // Дыхательная практика восстанавливает энергию компаньона.
    const energy = Math.min(
      MAX_ENERGY,
      (state.energy ?? MAX_ENERGY) + (PRACTICE_ENERGY_REWARD.breathing ?? 0),
    );

    const { experience, level, leveledUp } = applyLevelUp(state, EXERCISE_EXP);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: { calmness: finalCalmness, lastExerciseAt: new Date(), energy, experience, level },
      }),
      prisma.breathingSession.create({
        data: { userId, duration, initialCalmness, finalCalmness },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source: 'breathing', xpAwarded: EXERCISE_EXP },
      }),
    ]);

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...updated, sessionCount },
      leveledUp,
    };
  },

  async checkIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Чтение lastCheckInAt, расчёт streak и начисление XP — атомарно под
    // блокировкой User: два параллельных check-in не дадут двойного начисления.
    const result = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const state = await getOrCreateCreatureState(tx, userId);

      const lastCheckIn = state.lastCheckInAt ? new Date(state.lastCheckInAt) : null;

      // Разрыв в днях между прошлым и сегодняшним чек-ином (0, если чек-ина
      // ещё не было). gapDays=1 — обычное продолжение серии (вчера→сегодня).
      let gapDays = 0;
      if (lastCheckIn) {
        const lastDate = new Date(lastCheckIn);
        lastDate.setHours(0, 0, 0, 0);
        if (lastDate.getTime() === today.getTime()) {
          throw new AppError('ALREADY_CHECKED_IN', 409, 'Already checked in today');
        }
        gapDays = Math.round((today.getTime() - lastDate.getTime()) / MS_PER_DAY);
      }

      let newStreak = 1;
      let streakFreezeUsed = false;
      let nextStreakFreezeCount = state.streakFreezeCount ?? 0;
      if (lastCheckIn) {
        if (gapDays === 1) {
          newStreak = (state.streak ?? 0) + 1;
        } else if (gapDays === 2 && nextStreakFreezeCount > 0) {
          // Пропущен ровно один день — токен заморозки сохраняет серию вместо сброса.
          newStreak = (state.streak ?? 0) + 1;
          streakFreezeUsed = true;
          nextStreakFreezeCount -= 1;
        }
      }

      // Comeback-тир — независимо от судьбы streak, по фактическому разрыву
      // в чек-инах (заморозка выше покрывает только 1 пропущенный день,
      // поэтому пересечения с 7+ дневными тирами не бывает).
      const comebackTier = lastCheckIn ? comebackTierForGap(gapDays) : null;
      const bonusXp = comebackTier?.xp ?? 0;
      const checkInXp = CHECKIN_EXP + bonusXp;
      const { experience, level, leveledUp } = applyLevelUp(state, checkInXp);
      const nextComfort = comebackTier
        ? Math.min(100, (state.comfort ?? 0) + comebackTier.comfortGain)
        : state.comfort;

      // Компаньон уходит «гулять» после чек-ина, если не гуляет уже —
      // возврат оформляется отдельно через claimAdventureReturn().
      const adventureData = state.adventureReturnAt
        ? {}
        : {
            adventureReturnAt: new Date(Date.now() + ADVENTURE_DURATION_HOURS * 60 * 60 * 1000),
            adventureNotified: false,
          };

      const updated = await tx.creatureState.update({
        where: { userId },
        data: {
          energy: MAX_ENERGY,
          experience,
          level,
          streak: newStreak,
          lastCheckInAt: new Date(),
          streakFreezeCount: nextStreakFreezeCount,
          comfort: nextComfort,
          ...adventureData,
        },
      });
      await tx.practiceCompletion.create({
        data: { userId, source: 'checkin', xpAwarded: checkInXp },
      });

      return {
        updated,
        leveledUp,
        streakFreezeUsed,
        comebackDays: comebackTier?.days,
      };
    });

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...result.updated, sessionCount },
      leveledUp: result.leveledUp,
      streakFreezeUsed: result.streakFreezeUsed,
      comebackDays: result.comebackDays,
    };
  },

  // Забрать награду за «прогулку» — доступно, когда adventureReturnAt в
  // прошлом. Награда — отдельный повод от welcome/comeback (см.
  // PetRewardKind: 'adventure' на фронтенде), не «Возвращение».
  async claimAdventureReturn(userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const state = await getOrCreateCreatureState(tx, userId);

      if (!state.adventureReturnAt) {
        throw new AppError('NO_ACTIVE_ADVENTURE', 409, 'No active adventure');
      }
      if (state.adventureReturnAt.getTime() > Date.now()) {
        throw new AppError('ADVENTURE_NOT_READY', 409, 'Adventure not finished yet');
      }

      const { experience, level, leveledUp } = applyLevelUp(state, ADVENTURE_XP);
      const nextComfort = Math.min(100, (state.comfort ?? 0) + ADVENTURE_COMFORT_GAIN);

      const updated = await tx.creatureState.update({
        where: { userId },
        data: {
          experience,
          level,
          comfort: nextComfort,
          adventureReturnAt: null,
          adventureNotified: false,
        },
      });

      return { updated, leveledUp };
    });

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...result.updated, sessionCount },
      leveledUp: result.leveledUp,
      xpAwarded: ADVENTURE_XP,
      comfortGain: ADVENTURE_COMFORT_GAIN,
    };
  },

  async rewardPractice(userId: string, source: string) {
    const xp = PRACTICE_XP[source];
    if (xp === undefined) {
      throw new AppError('INVALID_SOURCE', 400, `Unknown practice source: ${source}`);
    }

    const state = await this.getState(userId);
    // Каждая практика восстанавливает энергию компаньона (зависит от вида).
    const energy = Math.min(
      MAX_ENERGY,
      (state.energy ?? MAX_ENERGY) + (PRACTICE_ENERGY_REWARD[source] ?? 0),
    );
    const { experience, level, leveledUp } = applyLevelUp(state, xp);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: { experience, level, energy },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source, xpAwarded: xp },
      }),
    ]);

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...updated, sessionCount },
      leveledUp,
    };
  },

  async getCompletions(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const completions = await prisma.practiceCompletion.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { source: true, xpAwarded: true, createdAt: true },
    });

    return completions.filter((c) => c.source !== 'feed' && c.source !== 'play');
  },

  async rewardMoodEntry(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const moodCount = await prisma.practiceCompletion.count({
      where: { userId, source: 'moodEntry', createdAt: { gte: today, lt: todayEnd } },
    });
    if (moodCount >= MOOD_ENTRY_DAILY_LIMIT) return null;

    const state = await this.getState(userId);
    const { experience, level, leveledUp } = applyLevelUp(state, MOOD_ENTRY_XP);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: { experience, level },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source: 'moodEntry', xpAwarded: MOOD_ENTRY_XP },
      }),
    ]);

    achievementsService.check(userId).catch(() => {});

    return { ...updated, leveledUp };
  },

  async feed(userId: string) {
    const state = await this.getState(userId);
    const petType = state.petType ?? 'puff';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayFeeds = await prisma.practiceCompletion.count({
      where: { userId, source: 'feed', createdAt: { gte: today, lt: todayEnd } },
    });
    const xpAwarded = todayFeeds < FEED_XP_DAILY_LIMIT ? FEED_XP : 0;

    const feedCounts = { ...((state.feedCounts as Record<string, number>) ?? {}) };
    feedCounts[petType] = (feedCounts[petType] ?? 0) + 1;

    const { experience, level, leveledUp } = applyLevelUp(state, xpAwarded);

    const [updated] = await Promise.all([
      prisma.creatureState.update({
        where: { userId },
        data: {
          feedCount: { increment: 1 },
          feedCounts,
          experience,
          level,
        },
      }),
      prisma.practiceCompletion.create({
        data: { userId, source: 'feed', xpAwarded },
      }),
    ]);

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    achievementsService.check(userId).catch(() => {});

    return {
      state: { ...updated, sessionCount },
      leveledUp,
      xpAwarded,
      feedCount: updated.feedCount,
      feedCounts: (updated.feedCounts as Record<string, number>) ?? {},
    };
  },

  // Недельный календарь: неделя Пн–Вс (см. mondayOfWeek/weekKey), считаем
  // уникальные дни с «настоящей» практикой/чек-ином (без feed/moodEntry/
  // play/weeklyGoal — те же исключения, что и в статистике практик).
  async getWeekly(userId: string) {
    const state = await prisma.creatureState.findUnique({ where: { userId } });
    const now = new Date();
    const monday = mondayOfWeek(now);
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const completions = await prisma.practiceCompletion.findMany({
      where: { userId, createdAt: { gte: monday, lt: weekEnd } },
      select: { source: true, createdAt: true },
    });
    const countedDays = new Set(
      completions
        .filter((c) => !WEEKLY_EXCLUDED_SOURCES.includes(c.source))
        .map((c) => dateKey(c.createdAt)),
    );

    const currentWeekKey = weekKey(now);
    const claimed = state?.weeklyClaimWeek === currentWeekKey;
    const completedCount = countedDays.size;
    const goalReached = completedCount >= WEEKLY_GOAL_DAYS;
    const todayKey = dateKey(now);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const key = dateKey(d);
      return {
        date: key,
        dayOfWeek: i,
        completed: countedDays.has(key),
        isToday: key === todayKey,
        isFuture: d.getTime() > now.getTime(),
      };
    });

    return {
      weekStart: dateKey(monday),
      days,
      completedCount,
      goal: WEEKLY_GOAL_DAYS,
      goalReached,
      claimed,
      xpReward: WEEKLY_XP_REWARD,
    };
  },

  // Забрать недельный подарок: одноразово на неделю (weeklyClaimWeek), только
  // если цель уже достигнута. Транзакция + lockUser — тот же паттерн, что у
  // claimMission(), чтобы параллельный claim не начислил XP дважды.
  async claimWeekly(userId: string) {
    return prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const state = await getOrCreateCreatureState(tx, userId);

      const now = new Date();
      const currentWeekKey = weekKey(now);
      if (state.weeklyClaimWeek === currentWeekKey) {
        throw new AppError('ALREADY_CLAIMED', 409, 'Weekly reward already claimed');
      }

      const monday = mondayOfWeek(now);
      const weekEnd = new Date(monday);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const completions = await tx.practiceCompletion.findMany({
        where: { userId, createdAt: { gte: monday, lt: weekEnd } },
        select: { source: true, createdAt: true },
      });
      const countedDays = new Set(
        completions
          .filter((c) => !WEEKLY_EXCLUDED_SOURCES.includes(c.source))
          .map((c) => dateKey(c.createdAt)),
      );
      if (countedDays.size < WEEKLY_GOAL_DAYS) {
        throw new AppError('GOAL_NOT_REACHED', 400, 'Weekly goal not reached yet');
      }

      const { experience, level, leveledUp } = applyLevelUp(state, WEEKLY_XP_REWARD);
      const updated = await tx.creatureState.update({
        where: { userId },
        data: { experience, level, weeklyClaimWeek: currentWeekKey },
      });
      await tx.practiceCompletion.create({
        data: { userId, source: 'weeklyGoal', xpAwarded: WEEKLY_XP_REWARD },
      });

      return { claimed: true, xpAwarded: WEEKLY_XP_REWARD, leveledUp, state: updated };
    });
  },

  // Поглаживание компаньона: детерминированный цикл 1-2-3. Каждый 3-й клик
  // даёт XP (PET_XP) и тратит 1 энергии (PET_ENERGY_COST), клики 1-2 — только
  // анимация/эмодзи. Когда энергия на нуле, 3-й клик XP не даёт. Дневной лимит
  // кликов = PET_DAILY_CLICK_LIMIT (300 → 100 XP). Счётчик сбрасывается при
  // наступлении нового дня (по серверному времени).
  //
  // Скрытые бонусы (сервер — источник правды о награде):
  //  - «Бодрое утро» (6-12): 3-й клик даёт MORNING_XP (+2) вместо +1.
  //  - «Спокойный вечер» (20-23): 3-й клик даёт +1 XP и +1 calmness.
  //  - «Комбо»: серия кликов с интервалом < COMBO_WINDOW_MS; на каждом
  //    COMBO_THRESHOLD-м быстром клике начисляется +COMBO_XP.
  //  - «Возвращение»: после паузы > WELCOME_PAUSE_HOURS первые
  //    WELCOME_CLICK_COUNT кликов дают по WELCOME_XP (+2) каждый.
  //  - «Эмпатия» (клиент передаёт флаг): 3-й клик даёт +1 XP и
  //    +EMPATHY_COMFORT_GAIN к параметру «Утешение» (comfort).
  async pet(userId: string, empathy = false) {
    // Чтение счётчика, сброс при новом дне, расчёт бонусов и начисление XP —
    // атомарно под блокировкой User: параллельные клики не дадут двойного
    // начисления ни по одному из бонусов.
    const result = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const state = await getOrCreateCreatureState(tx, userId);

      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastPet = state.lastPetAt ? new Date(state.lastPetAt) : null;
      const petCount = (() => {
        if (lastPet) {
          const lastPetDate = new Date(lastPet);
          lastPetDate.setHours(0, 0, 0, 0);
          if (lastPetDate.getTime() === today.getTime()) {
            return state.petCount ?? 0;
          }
        }
        // Новый день — счётчик обнуляется.
        return 0;
      })();

      const limitReached = petCount >= PET_DAILY_CLICK_LIMIT;
      const nextPetCount = limitReached ? petCount : petCount + 1;
      // Цикл 1-2-3: позиция текущего клика (до инкремента).
      const cyclePosition = (petCount % PET_CYCLE) + 1;
      const isXpClick = cyclePosition === PET_CYCLE;

      const energy = state.energy ?? MAX_ENERGY;
      const hasEnergy = energy > 0;

      // Временные окна бонусов — по серверному часу.
      const hour = now.getHours();
      const morning = isMorningWindow(hour);
      const evening = isEveningWindow(hour);

      // «Возвращение»: пауза > WELCOME_PAUSE_HOURS открывает «сессию
      // возвращения» — первые WELCOME_CLICK_COUNT кликов дают +2 XP. Сессия
      // активна, если пауза свежая либо уже начата (welcomeUsed > 0).
      // Первый клик вообще (lastPet === null) бонусом не считается.
      const pauseMs = lastPet ? now.getTime() - lastPet.getTime() : null;
      const freshPause =
        lastPet !== null && pauseMs !== null && pauseMs > WELCOME_PAUSE_HOURS * 60 * 60 * 1000;
      const welcomeUsed = freshPause ? 0 : (state.welcomeUsed ?? 0);
      const welcomeSessionActive = freshPause || welcomeUsed > 0;
      const welcomeApplied =
        welcomeSessionActive && welcomeUsed < WELCOME_CLICK_COUNT && !limitReached && hasEnergy;

      // Базовый XP: «Возвращение» перекрывает цикл для первых кликов.
      let xp = 0;
      let calmnessGain = 0;
      let comfortGain = 0;
      if (welcomeApplied) {
        xp += WELCOME_XP;
      } else if (isXpClick && !limitReached && hasEnergy) {
        xp += morning ? MORNING_XP : PET_XP;
        if (evening) calmnessGain += EVENING_CALMNESS_GAIN;
        if (empathy) comfortGain += EMPATHY_COMFORT_GAIN;
      }

      // «Комбо»: храним последние метки кликов, считаем длину серии.
      // Бонус начисляется только при активной игре: не на лимите дня и с
      // энергией — иначе быстрые клики обходили дневной лимит XP.
      const prevTimes = Array.isArray(state.petTimes)
        ? (state.petTimes as number[]).map(Number)
        : [];
      const times = [...prevTimes.slice(-(PET_TIMES_BUFFER - 1)), now.getTime()];
      const comboCount = !limitReached && hasEnergy ? computeComboCount(times) : 0;
      const comboBonusAwarded = comboCount >= COMBO_THRESHOLD && comboCount % COMBO_THRESHOLD === 0;
      if (comboBonusAwarded) xp += COMBO_XP;

      // XP и трата энергии — только на 3-м клике, когда энергия есть.
      const nextEnergy = isXpClick && hasEnergy ? Math.max(0, energy - PET_ENERGY_COST) : energy;
      const nextCalmness = Math.min(100, (state.calmness ?? 50) + calmnessGain);
      const nextComfort = Math.min(100, (state.comfort ?? 0) + comfortGain);

      const { experience, level, leveledUp } = applyLevelUp(state, xp);

      const updated = await tx.creatureState.update({
        where: { userId },
        data: {
          petCount: nextPetCount,
          lastPetAt: now,
          energy: nextEnergy,
          experience,
          level,
          calmness: nextCalmness,
          comfort: nextComfort,
          welcomeUsed: welcomeApplied ? welcomeUsed + 1 : welcomeUsed,
          petTimes: times,
        },
      });

      return {
        updated,
        leveledUp,
        xp,
        petCount: nextPetCount,
        cyclePosition,
        limitReached,
        calmnessGain,
        comfortGain,
        comboCount,
        comboBonusAwarded,
        bonus: { morning, evening, welcome: welcomeApplied, empathy },
      };
    });

    const sessionCount = await prisma.breathingSession.count({ where: { userId } });

    return {
      state: {
        ...result.updated,
        petCount: result.petCount,
        petCountRemaining: Math.max(0, PET_DAILY_CLICK_LIMIT - result.petCount),
        sessionCount,
      },
      leveledUp: result.leveledUp,
      xpAwarded: result.xp,
      petCount: result.petCount,
      cyclePosition: result.cyclePosition,
      petCountRemaining: Math.max(0, PET_DAILY_CLICK_LIMIT - result.petCount),
      limitReached: result.limitReached,
      calmnessGain: result.calmnessGain,
      comfortGain: result.comfortGain,
      comboCount: result.comboCount,
      comboBonusAwarded: result.comboBonusAwarded,
      bonus: result.bonus,
    };
  },
};
