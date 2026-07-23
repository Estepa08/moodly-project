import {
  CRISIS_MESSAGES,
  DISTORTIONS,
  PHQ9_BANDS,
  GAD7_BANDS,
  BURNS_ANXIETY_BANDS,
  BURNS_DEPRESSION_BANDS,
  GENERIC_RATIO_BANDS,
  cdInterpretation,
  cdRecommendation,
  type ScoreBand,
} from "../content/test-interpretation-content.js";

interface TestAnswer {
  questionId: string;
  optionId: string;
}

interface Interpretation {
  interpretation: string;
  recommendation: string;
  flags?: Record<string, unknown>;
}

type InterpretFn = (score: number, maxScore: number, answers: TestAnswer[]) => Interpretation;

function findBand(bands: ScoreBand[], score: number): ScoreBand {
  return bands.find((b) => score <= b.maxScore) ?? bands[bands.length - 1];
}

function detectSuicideFlags(answers: TestAnswer[], suicideQuestionIds: string[], planQuestionId?: string): Record<string, unknown> {
  const flags: Record<string, unknown> = {};
  for (const answer of answers) {
    if (!suicideQuestionIds.includes(answer.questionId)) continue;
    const optionIdNum = parseInt(answer.optionId.split("-").pop() || "0", 10);
    if (optionIdNum > 0) {
      flags.suicidalIdeation = true;
      if (planQuestionId ? answer.questionId === planQuestionId : optionIdNum >= 2) {
        flags.suicidalPlan = true;
      }
    }
  }
  return flags;
}

function applyCrisisOverride(recommendation: string, flags: Record<string, unknown>): string {
  if (!flags.suicidalIdeation) return recommendation;
  if (flags.suicidalPlan) return CRISIS_MESSAGES.criticalActiveThoughts;
  return CRISIS_MESSAGES.urgent;
}

const interpretations: Record<string, InterpretFn> = {
  "PHQ-9": (score, _maxScore, answers) => {
    const flags = detectSuicideFlags(answers, ["phq9-9"]);
    const band = findBand(PHQ9_BANDS, score);
    const recommendation = applyCrisisOverride(band.recommendation, flags);
    return { interpretation: band.interpretation, recommendation, flags: Object.keys(flags).length > 0 ? flags : undefined };
  },

  "GAD-7": (score) => {
    const band = findBand(GAD7_BANDS, score);
    return { interpretation: band.interpretation, recommendation: band.recommendation };
  },

  "Burns Anxiety Inventory": (score) => {
    const band = findBand(BURNS_ANXIETY_BANDS, score);
    return { interpretation: band.interpretation, recommendation: band.recommendation };
  },

  "Burns Depression Checklist": (score, _maxScore, answers) => {
    const flags = detectSuicideFlags(answers, ["bdc-23", "bdc-24", "bdc-25"], "bdc-25");
    const band = findBand(BURNS_DEPRESSION_BANDS, score);
    let recommendation = applyCrisisOverride(band.recommendation, flags);
    if (flags.suicidalIdeation && flags.suicidalPlan) recommendation = CRISIS_MESSAGES.criticalPlan;
    return { interpretation: band.interpretation, recommendation, flags: Object.keys(flags).length > 0 ? flags : undefined };
  },

  "Cognitive Distortions Assessment": (_score, _maxScore, answers) => {
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

    const ratioFor = (i: number) => (questionCount[i] > 0 ? distortionScores[i] / (questionCount[i] * 3) : 0);

    const distortions: Record<string, { score: number; level: string }> = {};
    for (let i = 0; i < 10; i++) {
      const ratio = ratioFor(i);
      const level = ratio > 0.66 ? "high" : ratio > 0.33 ? "moderate" : "low";
      distortions[DISTORTIONS[i].key] = { score: distortionScores[i], level };
    }

    const highKeys = DISTORTIONS.filter((_, i) => questionCount[i] > 0 && ratioFor(i) > 0.66).map((d) => d.key);
    const moderateKeys = DISTORTIONS.filter((_, i) => questionCount[i] > 0 && ratioFor(i) > 0.33 && ratioFor(i) <= 0.66).map((d) => d.key);

    const templateKey = highKeys.length > 0 ? "severe" : moderateKeys.length > 0 ? "moderate" : "minimal";
    const highNames = highKeys.map((k) => DISTORTIONS.find((d) => d.key === k)!.name);
    const moderateNames = moderateKeys.map((k) => DISTORTIONS.find((d) => d.key === k)!.name);

    return {
      interpretation: cdInterpretation(templateKey, highNames, moderateNames),
      recommendation: cdRecommendation(templateKey),
      flags: { distortions, templateKey, recommendationKey: templateKey, highKeys, moderateKeys },
    };
  },
};

export function getInterpretation(testTitle: string, score: number, maxScore: number, answers: TestAnswer[]): Interpretation {
  const fn = interpretations[testTitle];
  if (fn) return fn(score, maxScore, answers);

  const ratio = maxScore > 0 ? score / maxScore : 0;
  const band = GENERIC_RATIO_BANDS.find((b) => ratio < b.maxRatio) ?? GENERIC_RATIO_BANDS[GENERIC_RATIO_BANDS.length - 1];
  return { interpretation: band.interpretation, recommendation: band.recommendation };
}
