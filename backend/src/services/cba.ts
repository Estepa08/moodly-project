import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { deleteOwned } from '../lib/ownership.js';

export interface CbaEntryItemInput {
  itemType: 'advantage' | 'disadvantage';
  itemText: string;
}

export interface CbaEntryCreateInput {
  userId: string;
  thoughtText: string;
  prosWeight: number;
  consWeight: number;
  items: CbaEntryItemInput[];
}

const MAX_THOUGHT_TEXT_LENGTH = 2000;
const MAX_ITEM_TEXT_LENGTH = 500;
const MAX_ITEMS = 100;

function validateEntryInput(input: CbaEntryCreateInput) {
  if (
    input.prosWeight < 0 ||
    input.prosWeight > 100 ||
    input.consWeight < 0 ||
    input.consWeight > 100
  ) {
    throw new AppError('VALIDATION_ERROR', 400, 'Weights must be between 0 and 100');
  }
  if (input.prosWeight + input.consWeight !== 100) {
    throw new AppError('VALIDATION_ERROR', 400, 'Weights must sum to 100');
  }
  if (input.thoughtText.length === 0 || input.thoughtText.length > MAX_THOUGHT_TEXT_LENGTH) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      `thoughtText must be 1-${MAX_THOUGHT_TEXT_LENGTH} characters`,
    );
  }
  if (input.items.length > MAX_ITEMS) {
    throw new AppError('VALIDATION_ERROR', 400, `At most ${MAX_ITEMS} items are allowed`);
  }
  if (
    input.items.some((i) => i.itemText.length === 0 || i.itemText.length > MAX_ITEM_TEXT_LENGTH)
  ) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      `itemText must be 1-${MAX_ITEM_TEXT_LENGTH} characters`,
    );
  }
  const hasAdvantage = input.items.some((i) => i.itemType === 'advantage');
  const hasDisadvantage = input.items.some((i) => i.itemType === 'disadvantage');
  if (!hasAdvantage || !hasDisadvantage) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'At least one advantage and one disadvantage are required',
    );
  }
}

export const cbaService = {
  async listExamples() {
    return prisma.cbaExample.findMany({
      orderBy: { order: 'asc' },
      include: { items: true, distortions: true },
    });
  },

  async listCommonItems() {
    return prisma.cbaCommonItem.findMany();
  },

  async createEntry(input: CbaEntryCreateInput) {
    validateEntryInput(input);
    return prisma.cbaEntry.create({
      data: {
        userId: input.userId,
        thoughtText: input.thoughtText,
        prosWeight: input.prosWeight,
        consWeight: input.consWeight,
        items: { create: input.items },
      },
      include: { items: true },
    });
  },

  async listEntries(userId: string) {
    return prisma.cbaEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  },

  async deleteEntry(id: string, userId: string) {
    await deleteOwned(prisma.cbaEntry, id, userId, 'CbaEntry');
  },
};
