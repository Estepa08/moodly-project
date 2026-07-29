import { useTestTranslation } from "./useTestTranslation";
import { Trend } from "../lib/constants";

interface ResultFlags {
  templateKey?: string;
  recommendationKey?: string;
  highKeys?: string[];
  moderateKeys?: string[];
}

interface ResultLike {
  interpretation: string;
  recommendation: string;
  flags?: unknown;
}

export function isSevereInterpretation(interpretation: string): boolean {
  return interpretation.startsWith("Severe") || interpretation.startsWith("Extreme");
}

export function useTestResultText() {
  const { tInterpretation, tRecommendation, tCDInterpretation, tCDRecommendation } =
    useTestTranslation();

  function resolve(result: ResultLike) {
    const flags = result.flags as ResultFlags | undefined;
    const isCD = flags?.templateKey !== undefined;
    const highKeys = flags?.highKeys || [];
    const moderateKeys = flags?.moderateKeys || [];

    const interpretationText = isCD
      ? tCDInterpretation(flags!.templateKey!, highKeys, moderateKeys, result.interpretation)
      : tInterpretation(result.interpretation);
    const recommendationText = isCD
      ? tCDRecommendation(flags!.recommendationKey || "minimal", result.recommendation)
      : tRecommendation(result.recommendation);

    return {
      isCD,
      highKeys,
      moderateKeys,
      interpretationText,
      recommendationText,
      isSevere: isSevereInterpretation(result.interpretation),
    };
  }

  return { resolve };
}
