import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { deleteOwned } from '../lib/ownership.js';

export interface ResponsibilityFactorInput {
  label: string;
  percent: number;
}

export interface ResponsibilityPieEntryCreateInput {
  userId: string;
  situationText: string;
  factors: ResponsibilityFactorInput[];
}

const MAX_SITUATION_TEXT_LENGTH = 2000;
const MAX_FACTOR_LABEL_LENGTH = 100;
const MIN_FACTORS = 2;
const MAX_FACTORS = 8;

function validateEntryInput(input: ResponsibilityPieEntryCreateInput) {
  if (
    input.situationText.length === 0 ||
    input.situationText.length > MAX_SITUATION_TEXT_LENGTH
  ) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      `situationText must be 1-${MAX_SITUATION_TEXT_LENGTH} characters`,
    );
  }
  if (input.factors.length < MIN_FACTORS || input.factors.length > MAX_FACTORS) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      `Between ${MIN_FACTORS} and ${MAX_FACTORS} factors are required`,
    );
  }
  if (input.factors.some((f) => f.percent < 0 || f.percent > 100)) {
    throw new AppError('VALIDATION_ERROR', 400, 'percent must be between 0 and 100');
  }
  if (input.factors.some((f) => f.label.length === 0 || f.label.length > MAX_FACTOR_LABEL_LENGTH)) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      `label must be 1-${MAX_FACTOR_LABEL_LENGTH} characters`,
    );
  }
  const total = input.factors.reduce((sum, f) => sum + f.percent, 0);
  if (total !== 100) {
    throw new AppError('VALIDATION_ERROR', 400, 'Factor percentages must sum to 100');
  }
}

export const responsibilityPieService = {
  async createEntry(input: ResponsibilityPieEntryCreateInput) {
    validateEntryInput(input);
    return prisma.responsibilityPieEntry.create({
      data: {
        userId: input.userId,
        situationText: input.situationText,
        factors: { create: input.factors },
      },
      include: { factors: true },
    });
  },

  async listEntries(userId: string) {
    return prisma.responsibilityPieEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { factors: true },
    });
  },

  async deleteEntry(id: string, userId: string) {
    await deleteOwned(prisma.responsibilityPieEntry, id, userId, 'ResponsibilityPieEntry');
  },
};
