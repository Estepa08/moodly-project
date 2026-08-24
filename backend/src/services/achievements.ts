import { prisma } from '../lib/prisma.js';
import { lockUser } from '../lib/user-lock.js';
import { AppError, NotFoundError } from '../lib/errors.js';

export const achievementsService = {
  async getAll(userId: string) {
    const all = await prisma.achievement.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    const completions = await prisma.practiceCompletion.findMany({
      where: { userId },
      select: { source: true, xpAwarded: true, createdAt: true },
    });
    const practiceCompletions = completions.filter(
      (c) => c.source !== 'moodEntry' && c.source !== 'feed' && c.source !== 'play',
    );
    const breathingCount = await prisma.breathingSession.count({ where: { userId } });
    const totalXp = completions.reduce((sum, c) => sum + c.xpAwarded, 0);
    const uniquePractices = new Set(practiceCompletions.map((c) => c.source));
    const extra = await collectExtraMetrics(prisma, userId, completions);

    return all.map((a) => {
      const criteria = a.criteria as Record<string, unknown>;
      const progress = calculateProgress(
        criteria,
        creature,
        practiceCompletions.length,
        breathingCount,
        totalXp,
        uniquePractices,
        creature?.feedCount ?? 0,
        extra,
      );
      const isUnlocked = unlockedMap.has(a.id);
      return {
        id: a.id,
        key: a.key,
        category: a.category,
        titleKey: a.titleKey,
        descKey: a.descKey,
        iconName: a.iconName,
        skinReward: a.skinReward,
        titleReward: a.titleReward,
        petTypeReward: a.petTypeReward,
        xpReward: a.xpReward,
        streakFreezeReward: a.streakFreezeReward,
        sortOrder: a.sortOrder,
        unlocked: isUnlocked,
        unlockedAt: unlockedMap.get(a.id) ?? null,
        progress,
      };
    });
  },

  async check(userId: string) {
    const all = await prisma.achievement.findMany();
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    const completions = await prisma.practiceCompletion.findMany({
      where: { userId },
      select: { source: true, xpAwarded: true, createdAt: true },
    });
    const practiceCompletions = completions.filter(
      (c) => c.source !== 'moodEntry' && c.source !== 'feed' && c.source !== 'play',
    );
    const breathingCount = await prisma.breathingSession.count({ where: { userId } });
    const totalXp = completions.reduce((sum, c) => sum + c.xpAwarded, 0);
    const uniquePractices = new Set(practiceCompletions.map((c) => c.source));
    const extra = await collectExtraMetrics(prisma, userId, completions);

    const newlyUnlocked: typeof all = [];

    for (const a of all) {
      if (unlockedIds.has(a.id)) continue;
      const criteria = a.criteria as Record<string, unknown>;
      const progress = calculateProgress(
        criteria,
        creature,
        practiceCompletions.length,
        breathingCount,
        totalXp,
        uniquePractices,
        creature?.feedCount ?? 0,
        extra,
      );
      if (progress >= 100) {
        newlyUnlocked.push(a);
      }
    }

    if (newlyUnlocked.length === 0) return [];

    // Начисление наград — в транзакции с блокировкой User. Поточечный
    // createMany со skipDuplicates и проверкой count гарантирует, что XP/скины/
    // титулы/питомцы начисляются ровно один раз даже при параллельных check().
    const result = await prisma.$transaction(async (tx) => {
      await lockUser(tx, userId);

      const actuallyUnlocked: typeof all = [];
      for (const a of newlyUnlocked) {
        const inserted = await tx.userAchievement.createMany({
          data: [{ userId, achievementId: a.id }],
          skipDuplicates: true,
        });
        if (inserted.count > 0) actuallyUnlocked.push(a);
      }

      if (actuallyUnlocked.length === 0) return null;

      let xpBonus = 0;
      let streakFreezeBonus = 0;
      const skins: string[] = [];
      const titles: string[] = [];
      const petTypes: string[] = [];

      for (const a of actuallyUnlocked) {
        xpBonus += a.xpReward;
        streakFreezeBonus += a.streakFreezeReward ?? 0;
        if (a.skinReward) skins.push(a.skinReward);
        if (a.titleReward) titles.push(a.titleReward);
        if (a.petTypeReward) petTypes.push(a.petTypeReward);
      }

      if (
        xpBonus > 0 ||
        streakFreezeBonus > 0 ||
        skins.length > 0 ||
        titles.length > 0 ||
        petTypes.length > 0
      ) {
        const updateData: Record<string, unknown> = {};
        if (xpBonus > 0) {
          updateData.experience = { increment: xpBonus };
        }
        if (streakFreezeBonus > 0) {
          updateData.streakFreezeCount = { increment: streakFreezeBonus };
        }
        if (skins.length > 0) {
          updateData.unlockedSkins = { push: skins };
        }
        if (titles.length > 0) {
          updateData.unlockedTitles = { push: titles };
        }
        if (petTypes.length > 0) {
          updateData.unlockedPetTypes = { push: petTypes };
        }
        await tx.creatureState.update({
          where: { userId },
          data: updateData as never,
        });
      }

      return actuallyUnlocked.map((a) => ({
        id: a.id,
        key: a.key,
        category: a.category,
        titleKey: a.titleKey,
        descKey: a.descKey,
        iconName: a.iconName,
        skinReward: a.skinReward,
        titleReward: a.titleReward,
        petTypeReward: a.petTypeReward,
        xpReward: a.xpReward,
        streakFreezeReward: a.streakFreezeReward,
        sortOrder: a.sortOrder,
      }));
    });

    return result ?? [];
  },

  async getSkins(userId: string) {
    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    if (!creature) {
      return { unlockedSkins: ['default'], activeSkin: 'default' };
    }
    return {
      unlockedSkins: creature.unlockedSkins ?? ['default'],
      activeSkin: creature.activeSkin ?? 'default',
    };
  },

  async setSkin(userId: string, skin: string) {
    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    if (!creature) {
      throw new NotFoundError('CreatureState');
    }
    const unlocked = creature.unlockedSkins ?? ['default'];
    if (!unlocked.includes(skin)) {
      throw new AppError('SKIN_LOCKED', 403, 'Skin not unlocked');
    }
    const updated = await prisma.creatureState.update({
      where: { userId },
      data: { activeSkin: skin },
    });
    return { activeSkin: updated.activeSkin };
  },

  async setTitle(userId: string, title: string | null) {
    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    if (!creature) {
      throw new NotFoundError('CreatureState');
    }
    if (title !== null) {
      const unlocked = creature.unlockedTitles ?? [];
      if (!unlocked.includes(title)) {
        throw new AppError('TITLE_LOCKED', 403, 'Title not unlocked');
      }
    }
    const updated = await prisma.creatureState.update({
      where: { userId },
      data: { activeTitle: title },
    });
    return { activeTitle: updated.activeTitle };
  },
};

function percentOf(current: number, target: number): number {
  return Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
}

interface ExtraMetrics {
  moodEntryCount: number;
  gratitudeCount: number;
  thoughtJournalCount: number;
  thoughtJournalCycleCount: number;
  testCount: number;
  nightCount: number;
}

async function collectExtraMetrics(
  prisma: typeof import('../lib/prisma.js').prisma,
  userId: string,
  completions: { source: string; createdAt: Date }[],
): Promise<ExtraMetrics> {
  const sourceCounts: Record<string, number> = {};
  let nightCount = 0;
  for (const c of completions) {
    sourceCounts[c.source] = (sourceCounts[c.source] ?? 0) + 1;
    if (c.source !== 'feed' && c.source !== 'moodEntry' && c.source !== 'play') {
      const hour = c.createdAt.getHours();
      if (hour >= 22 || hour < 6) nightCount += 1;
    }
  }
  const testCount = await prisma.testResult.count({
    where: { userId, deletedAt: null },
  });
  return {
    moodEntryCount: sourceCounts['moodEntry'] ?? 0,
    gratitudeCount: sourceCounts['gratitude'] ?? 0,
    thoughtJournalCount: sourceCounts['thoughtJournal'] ?? 0,
    thoughtJournalCycleCount: sourceCounts['thoughtJournalCycle'] ?? 0,
    testCount,
    nightCount,
  };
}

function calculateProgress(
  criteria: Record<string, unknown>,
  creature: { level: number; experience: number; streak: number; feedCount: number } | null,
  totalCompletions: number,
  breathingCount: number,
  totalXp: number,
  uniquePractices?: Set<string>,
  feedCount = 0,
  extra?: ExtraMetrics,
): number {
  const type = criteria.type as string;
  const value = (criteria.value as number) ?? 0;

  if (value === 0) return 0;

  switch (type) {
    case 'streak':
      return percentOf(creature?.streak ?? 0, value);
    case 'level':
      return percentOf(creature?.level ?? 0, value);
    case 'breathing_count':
      return percentOf(breathingCount, value);
    case 'total_completions':
      return percentOf(totalCompletions, value);
    case 'total_xp':
      return percentOf(totalXp, value);
    case 'feed_count':
      return percentOf(feedCount, value);
    case 'all_practices':
      return (uniquePractices?.size ?? 0) >= 6 ? 100 : 0;
    case 'mood_entries':
      return percentOf(extra?.moodEntryCount ?? 0, value);
    case 'gratitude_count':
      return percentOf(extra?.gratitudeCount ?? 0, value);
    case 'thought_journal_count':
      return percentOf(extra?.thoughtJournalCount ?? 0, value);
    case 'thought_journal_cycle_count':
      return percentOf(extra?.thoughtJournalCycleCount ?? 0, value);
    case 'test_count':
      return percentOf(extra?.testCount ?? 0, value);
    case 'night_practices':
      return percentOf(extra?.nightCount ?? 0, value);
    default:
      return 0;
  }
}
