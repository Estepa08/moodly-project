import { prisma } from '../lib/prisma.js';
import { resolveInterpretation, type Interpretation } from '@moodly/shared';

interface TestAnswer {
  questionId: string;
  optionId: string;
}

export async function getInterpretation(
  testId: string,
  _testTitle: string,
  testType: string,
  score: number,
  maxScore: number,
  answers: TestAnswer[],
): Promise<Interpretation> {
  const bands = await prisma.testScoreBand.findMany({
    where: { testId },
    orderBy: { maxScore: 'asc' },
  });

  return resolveInterpretation({
    testType,
    score,
    maxScore,
    answers,
    bands: bands.map((b) => ({
      maxScore: b.maxScore,
      key: b.key,
      interpretation: b.interpretation,
      recommendation: b.recommendation,
    })),
  });
}
