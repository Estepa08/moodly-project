import { prisma } from "../lib/prisma.js";

export const achievementsService = {
  async getAll(userId: string) {
    const all = await prisma.achievement.findMany({
      orderBy: { sortOrder: "asc" },
    });

    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    const completions = await prisma.practiceCompletion.findMany({
      where: { userId },
      select: { source: true, xpAwarded: true },
    });
    const breathingCount = await prisma.breathingSession.count({ where: { userId } });
    const totalXp = completions.reduce((sum, c) => sum + c.xpAwarded, 0);
    const uniquePractices = new Set(completions.map((c) => c.source));

    return all.map((a) => {
      const criteria = a.criteria as Record<string, unknown>;
      const progress = calculateProgress(
        criteria,
        creature,
        completions.length,
        breathingCount,
        totalXp,
        uniquePractices,
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
      select: { source: true, xpAwarded: true },
    });
    const breathingCount = await prisma.breathingSession.count({ where: { userId } });
    const totalXp = completions.reduce((sum, c) => sum + c.xpAwarded, 0);
    const uniquePractices = new Set(completions.map((c) => c.source));

    const newlyUnlocked: typeof all = [];

    for (const a of all) {
      if (unlockedIds.has(a.id)) continue;
      const criteria = a.criteria as Record<string, unknown>;
      const progress = calculateProgress(
        criteria,
        creature,
        completions.length,
        breathingCount,
        totalXp,
        uniquePractices,
      );
      if (progress >= 100) {
        newlyUnlocked.push(a);
      }
    }

    if (newlyUnlocked.length === 0) return [];

    await prisma.userAchievement.createMany({
      data: newlyUnlocked.map((a) => ({
        userId,
        achievementId: a.id,
      })),
      skipDuplicates: true,
    });

    let xpBonus = 0;
    const skins: string[] = [];
    const titles: string[] = [];
    const petTypes: string[] = [];

    for (const a of newlyUnlocked) {
      xpBonus += a.xpReward;
      if (a.skinReward) skins.push(a.skinReward);
      if (a.titleReward) titles.push(a.titleReward);
      if (a.petTypeReward) petTypes.push(a.petTypeReward);
    }

    if (xpBonus > 0 || skins.length > 0 || titles.length > 0 || petTypes.length > 0) {
      const updateData: Record<string, unknown> = {};
      if (xpBonus > 0) {
        updateData.experience = { increment: xpBonus };
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
      await prisma.creatureState.update({
        where: { userId },
        data: updateData as never,
      });
    }

    return newlyUnlocked.map((a) => ({
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
      sortOrder: a.sortOrder,
    }));
  },

  async getSkins(userId: string) {
    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    if (!creature) {
      return { unlockedSkins: ["default"], activeSkin: "default" };
    }
    return {
      unlockedSkins: creature.unlockedSkins ?? ["default"],
      activeSkin: creature.activeSkin ?? "default",
    };
  },

  async setSkin(userId: string, skin: string) {
    const creature = await prisma.creatureState.findUnique({ where: { userId } });
    if (!creature) {
      throw new Error("Creature state not found");
    }
    const unlocked = creature.unlockedSkins ?? ["default"];
    if (!unlocked.includes(skin)) {
      throw new Error("Skin not unlocked");
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
      throw new Error("Creature state not found");
    }
    if (title !== null) {
      const unlocked = creature.unlockedTitles ?? [];
      if (!unlocked.includes(title)) {
        throw new Error("Title not unlocked");
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

function calculateProgress(
  criteria: Record<string, unknown>,
  creature: { level: number; experience: number; streak: number } | null,
  totalCompletions: number,
  breathingCount: number,
  totalXp: number,
  uniquePractices?: Set<string>,
): number {
  const type = criteria.type as string;
  const value = (criteria.value as number) ?? 0;

  if (value === 0) return 0;

  switch (type) {
    case "streak":
      return percentOf(creature?.streak ?? 0, value);
    case "level":
      return percentOf(creature?.level ?? 0, value);
    case "breathing_count":
      return percentOf(breathingCount, value);
    case "total_completions":
      return percentOf(totalCompletions, value);
    case "total_xp":
      return percentOf(totalXp, value);
    case "all_practices":
      return (uniquePractices?.size ?? 0) >= 6 ? 100 : 0;
    default:
      return 0;
  }
}
