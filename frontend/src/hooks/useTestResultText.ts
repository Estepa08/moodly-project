import { useTestTranslation } from "./useTestTranslation";

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

export function getCrisisSeverity(recommendation: string): "urgent" | "critical" | null {
  if (recommendation.startsWith("CRITICAL")) return "critical";
  if (recommendation.startsWith("URGENT")) return "urgent";
  return null;
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
      crisisSeverity: getCrisisSeverity(result.recommendation),
      isSevere: isSevereInterpretation(result.interpretation),
    };
  }

  return { resolve };
}
