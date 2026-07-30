import { Trend } from "../lib/constants";

interface ResultFlags {
  templateKey?: string;
  recommendationKey?: string;
  highKeys?: string[];
  moderateKeys?: string[];
  bandKey?: string;
}

interface ResultLike {
  interpretation: string;
  recommendation: string;
  flags?: unknown;
}

export function isSevereInterpretation(
  _interpretation: string,
  flags?: ResultFlags,
): boolean {
  const key = flags?.bandKey || flags?.templateKey || "";
  return ["severe", "extreme", "high"].includes(key);
}

export function useTestResultText() {
  function resolve(result: ResultLike) {
    const flags = result.flags as ResultFlags | undefined;
    const isCD = flags?.templateKey !== undefined;
    const highKeys = flags?.highKeys || [];
    const moderateKeys = flags?.moderateKeys || [];

    return {
      isCD,
      highKeys,
      moderateKeys,
      interpretationText: result.interpretation,
      recommendationText: result.recommendation,
      isSevere: isSevereInterpretation(result.interpretation, flags),
    };
  }

  return { resolve };
}
