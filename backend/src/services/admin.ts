import { prisma } from '../lib/prisma.js';
import { AppError, NotFoundError } from '../lib/errors.js';

const VALID_TIERS = ['free', 'premium'] as const;
export type Tier = (typeof VALID_TIERS)[number];

export interface UpdateTierInput {
  tier?: string;
  expiresAt?: string | null;
}

export const adminService = {
  async listUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        ageConfirmed: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        _count: {
          select: {
            entries: true,
            testResults: true,
            breathingSessions: true,
            cbaEntries: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      emailVerified: u.emailVerified,
      ageConfirmed: u.ageConfirmed,
      subscriptionTier: u.subscriptionTier,
      subscriptionExpiresAt: u.subscriptionExpiresAt,
      entriesCount: u._count.entries,
      testResultsCount: u._count.testResults,
      breathingSessionsCount: u._count.breathingSessions,
      cbaEntriesCount: u._count.cbaEntries,
    }));
  },

  async deleteUser(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new AppError('CANNOT_DELETE_SELF', 400, 'Cannot delete your own account');
    }
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundError('User');
    await prisma.user.delete({ where: { id } });
  },

  // Служебный метод для переключения тарифа вручную (биллинга нет — заготовка
  // под премиум-лимиты). tier: "free" | "premium", expiresAt — ISO или null.
  async updateTier(id: string, input: UpdateTierInput) {
    const { tier, expiresAt } = input;
    if (tier !== undefined && !(VALID_TIERS as readonly string[]).includes(tier)) {
      throw new AppError('VALIDATION_ERROR', 400, "tier must be 'free' or 'premium'");
    }
    let expiresAtDate: Date | null | undefined;
    if (expiresAt === null) {
      expiresAtDate = null;
    } else if (expiresAt !== undefined) {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new AppError('VALIDATION_ERROR', 400, 'expiresAt must be a valid ISO date or null');
      }
      expiresAtDate = parsed;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    return prisma.user.update({
      where: { id },
      data: {
        ...(tier !== undefined ? { subscriptionTier: tier } : {}),
        ...(expiresAtDate !== undefined ? { subscriptionExpiresAt: expiresAtDate } : {}),
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });
  },
};
