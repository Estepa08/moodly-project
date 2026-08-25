import { prisma } from '../lib/prisma.js';
import { NotFoundError, AppError } from '../lib/errors.js';
import { lockUser } from '../lib/user-lock.js';
import { deleteOwned } from '../lib/ownership.js';
import { creatureService } from './creature.js';

export interface EntryCreateInput {
  id: string;
  userId: string;
  parameterId: string;
  encryptedData: string;
}

export interface EntryUpdateInput {
  encryptedData: string;
}

export interface EntryListParams {
  userId: string;
  parameterId?: string;
  from?: string;
  to?: string;
  skip?: number;
  take?: number;
}

export const entryService = {
  async list(params: EntryListParams) {
    const where: Record<string, unknown> = { userId: params.userId };
    if (params.parameterId) where.parameterId = params.parameterId;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) (where.createdAt as Record<string, unknown>).gte = new Date(params.from);
      if (params.to) (where.createdAt as Record<string, unknown>).lte = new Date(params.to);
    }
    const [data, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take ?? 200,
      }),
      prisma.entry.count({ where }),
    ]);
    return { data, total };
  },

  async create(input: EntryCreateInput) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Проверка лимита и создание записи — в одной транзакции с блокировкой
    // строки User: два параллельных запроса не смогут оба пройти count < 100.
    const created = await prisma.$transaction(async (tx) => {
      await lockUser(tx, input.userId);

      const todayCount = await tx.entry.count({
        where: { userId: input.userId, createdAt: { gte: startOfToday } },
      });

      if (todayCount >= 100) {
        throw new AppError('DAILY_LIMIT', 429, 'Daily entry limit reached');
      }

      return tx.entry.create({
        data: {
          id: input.id,
          userId: input.userId,
          parameterId: input.parameterId,
          encryptedData: input.encryptedData,
        },
      });
    });

    await this.rewardMoodIfNeeded(input.userId, input.parameterId);

    return created;
  },

  async rewardMoodIfNeeded(userId: string, parameterId: string) {
    try {
      const parameter = await prisma.parameter.findUnique({ where: { id: parameterId } });
      if (parameter?.name === 'Mood') {
        await creatureService.rewardMoodEntry(userId);
      }
    } catch {
      // награда не должна ломать создание записи настроения
    }
  },

  async getById(id: string, userId: string) {
    const entry = await prisma.entry.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundError('Entry');
    return entry;
  },

  async update(id: string, userId: string, data: EntryUpdateInput) {
    const entry = await prisma.entry.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundError('Entry');
    return prisma.entry.update({ where: { id }, data });
  },

  async delete(id: string, userId: string) {
    await deleteOwned(prisma.entry, id, userId, 'Entry');
  },
};
