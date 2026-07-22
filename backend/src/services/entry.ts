import { prisma } from "../lib/prisma.js";
import { NotFoundError, AppError } from "../lib/errors.js";

export interface EntryCreateInput {
  userId: string;
  parameterId: string;
  value: number;
  note?: string;
}

export interface EntryUpdateInput {
  value?: number;
  note?: string;
}

export interface EntryListParams {
  userId: string;
  parameterId?: string;
  from?: string;
  to?: string;
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
    return prisma.entry.findMany({ where, orderBy: { createdAt: "desc" } });
  },

  async create(input: EntryCreateInput) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await prisma.entry.count({
      where: { userId: input.userId, createdAt: { gte: startOfToday } },
    });

    if (todayCount >= 100) {
      throw new AppError("DAILY_LIMIT", 429, "Daily entry limit reached");
    }

    return prisma.entry.create({
      data: { userId: input.userId, parameterId: input.parameterId, value: input.value, note: input.note },
    });
  },

  async getById(id: string, userId: string) {
    const entry = await prisma.entry.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundError("Entry");
    return entry;
  },

  async update(id: string, userId: string, data: EntryUpdateInput) {
    const entry = await prisma.entry.findFirst({ where: { id, userId } });
    if (!entry) throw new NotFoundError("Entry");
    return prisma.entry.update({ where: { id }, data });
  },

  async delete(id: string, userId: string) {
    const deleted = await prisma.entry.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) throw new NotFoundError("Entry");
  },
};
