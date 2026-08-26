import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { deleteOwned } from '../lib/ownership.js';

export interface DecatastrophizingEntryCreateInput {
  userId: string;
  worstCaseText: string;
  copingPlanText: string;
  mostLikelyText: string;
}

const MAX_TEXT_LENGTH = 2000;

function validateEntryInput(input: DecatastrophizingEntryCreateInput) {
  const fields: [string, string][] = [
    ['worstCaseText', input.worstCaseText],
    ['copingPlanText', input.copingPlanText],
    ['mostLikelyText', input.mostLikelyText],
  ];
  for (const [name, value] of fields) {
    if (value.length === 0 || value.length > MAX_TEXT_LENGTH) {
      throw new AppError(
        'VALIDATION_ERROR',
        400,
        `${name} must be 1-${MAX_TEXT_LENGTH} characters`,
      );
    }
  }
}

export const decatastrophizingService = {
  async createEntry(input: DecatastrophizingEntryCreateInput) {
    validateEntryInput(input);
    return prisma.decatastrophizingEntry.create({
      data: {
        userId: input.userId,
        worstCaseText: input.worstCaseText,
        copingPlanText: input.copingPlanText,
        mostLikelyText: input.mostLikelyText,
      },
    });
  },

  async listEntries(userId: string) {
    return prisma.decatastrophizingEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deleteEntry(id: string, userId: string) {
    await deleteOwned(prisma.decatastrophizingEntry, id, userId, 'DecatastrophizingEntry');
  },
};
