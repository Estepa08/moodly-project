import { prisma } from "../lib/prisma.js";

const RATIO_LOW_MAX = 1 / 3;
const RATIO_MODERATE_MAX = 2 / 3;

const DISTORTIONS = [
  { key: "allOrNothing", name: "All-or-Nothing Thinking" },
  { key: "overgeneralization", name: "Overgeneralization" },
  { key: "mentalFilter", name: "Mental Filter" },
  { key: "discountingPositive", name: "Discounting the Positive" },
  { key: "jumpingToConclusions", name: "Jumping to Conclusions" },
  { key: "magnification", name: "Magnification / Minimization" },
  { key: "emotionalReasoning", name: "Emotional Reasoning" },
  { key: "shouldStatements", name: "Should Statements" },
  { key: "labeling", name: "Labeling" },
  { key: "personalization", name: "Personalization" },
];

interface TestAnswer {
  questionId: string;
  optionId: string;
}

interface Interpretation {
  interpretation: string;
  recommendation: string;
  flags?: Record<string, unknown>;
}

function cognitiveDistortionInterpretation(
  templateKey: "severe" | "moderate" | "minimal",
  highNames: string[],
  moderateNames: string[],
): string {
  if (templateKey === "severe") {
    return `Значительные ${highNames.join(", ")}. ${
      moderateNames.length > 0 ? `Умеренные ${moderateNames.join(", ")}. ` : ""
    }Рекомендуется проработать эти паттерны с помощью когнитивно-поведенческой терапии.`;
  }
  if (templateKey === "moderate") {
    return `Умеренные ${moderateNames.join(", ")}. Осознание этих искажений — первый шаг к изменениям.`;
  }
  return "Когнитивных искажений не выявлено. Ваши мыслительные паттерны выглядят сбалансированными.";
}

function cognitiveDistortionRecommendation(recommendationKey: "severe" | "moderate" | "minimal"): string {
  if (recommendationKey === "severe") {
    return "Ваши результаты указывают на несколько сильно выраженных когнитивных искажений. Когнитивно-поведенческая терапия (КПТ) эффективна для проработки этих паттернов. Рекомендуется вести дневник мыслей и оспаривать искажённое мышление с помощью фактов.";
  }
  if (recommendationKey === "moderate") {
    return "У вас есть некоторая склонность к когнитивным искажениям. Попробуйте вести дневник мыслей и практиковать техники когнитивной перестройки.";
  }
  return "Значимых когнитивных искажений не обнаружено. Продолжайте практиковать сбалансированное мышление.";
}

export async function getInterpretation(
  testId: string,
  testTitle: string,
  testType: string,
  score: number,
  maxScore: number,
  answers: TestAnswer[],
): Promise<Interpretation> {
  if (testType === "computed") {
    return computeCognitiveDistortionInterpretation(answers);
  }

  const bands = await prisma.testScoreBand.findMany({
    where: { testId },
    orderBy: { maxScore: "asc" },
  });

  if (bands.length === 0) {
    const ratio = maxScore > 0 ? score / maxScore : 0;
    return {
      interpretation:
        ratio <= RATIO_LOW_MAX
          ? "Низкий результат"
          : ratio <= RATIO_MODERATE_MAX
            ? "Средний результат"
            : "Повышенный результат",
      recommendation:
        ratio <= RATIO_LOW_MAX
          ? "Продолжайте наблюдение."
          : ratio <= RATIO_MODERATE_MAX
            ? "Если состояние вызывает беспокойство, обратитесь к специалисту."
            : "Рекомендуем обратиться к консультанту.",
    };
  }

  const band = bands.find((b) => score <= b.maxScore) ?? bands[bands.length - 1];
  return { interpretation: band.interpretation, recommendation: band.recommendation, flags: { bandKey: band.key } };
}

function computeCognitiveDistortionInterpretation(answers: TestAnswer[]): Interpretation {
  const distortionScores = Array(10).fill(0);
  const questionCount = Array(10).fill(0);

  for (const answer of answers) {
    const match = answer.questionId.match(/^cd-(\d+)-(\d+)$/);
    if (!match) continue;
    const idx = parseInt(match[1], 10) - 1;
    const optionIdNum = parseInt(answer.optionId.split("-").pop() || "0", 10);
    distortionScores[idx] += optionIdNum;
    questionCount[idx]++;
  }

  const ratioFor = (i: number) =>
    questionCount[i] > 0 ? distortionScores[i] / (questionCount[i] * 3) : 0;

  const distortions: Record<string, { score: number; level: string }> = {};
  for (let i = 0; i < 10; i++) {
    const ratio = ratioFor(i);
    const level =
      ratio > RATIO_MODERATE_MAX ? "high" : ratio > RATIO_LOW_MAX ? "moderate" : "low";
    distortions[DISTORTIONS[i].key] = { score: distortionScores[i], level };
  }

  const highKeys = DISTORTIONS.filter(
    (_, i) => questionCount[i] > 0 && ratioFor(i) > RATIO_MODERATE_MAX,
  ).map((d) => d.key);
  const moderateKeys = DISTORTIONS.filter(
    (_, i) =>
      questionCount[i] > 0 && ratioFor(i) > RATIO_LOW_MAX && ratioFor(i) <= RATIO_MODERATE_MAX,
  ).map((d) => d.key);

  const templateKey =
    highKeys.length > 0 ? "severe" : moderateKeys.length > 0 ? "moderate" : "minimal";
  const highNames = highKeys.map((k) => DISTORTIONS.find((d) => d.key === k)!.name);
  const moderateNames = moderateKeys.map((k) => DISTORTIONS.find((d) => d.key === k)!.name);

  return {
    interpretation: cognitiveDistortionInterpretation(templateKey, highNames, moderateNames),
    recommendation: cognitiveDistortionRecommendation(templateKey),
    flags: { distortions, templateKey, recommendationKey: templateKey, highKeys, moderateKeys },
  };
}
