import { type DistortionKey } from "./distortionsQuiz";

const KEYWORD_MAP: Record<DistortionKey, string[]> = {
  allOrNothing: ["always fail", "total failure", "ruined everything", "complete disaster"],
  overgeneralization: ["always", "never", "every time", "everyone", "nobody"],
  mentalFilter: ["only thing", "can't stop thinking", "one bad", "just focus on"],
  discountingPositive: ["doesn't count", "wasn't real", "just luck", "anyone could"],
  jumpingToConclusions: ["they think", "must hate", "going to fail", "knows i"],
  magnification: ["ruin", "disaster", "terrible", "catastrophe", "the end of"],
  emotionalReasoning: ["i feel like", "must be true because i feel", "feels like i am"],
  shouldStatements: ["should have", "must be", "have to be", "ought to"],
  labeling: ["i'm such a", "i am a failure", "i'm stupid", "i'm a loser"],
  personalization: ["my fault", "because of me", "i caused", "i'm to blame"],
};

/**
 * Lightweight, transparent keyword heuristic — not NLP/ML. Intentionally
 * conservative (returns null often) since this only powers a dismissible,
 * non-diagnostic hint, never a label applied without the user's input.
 */
export function suggestDistortion(text: string): DistortionKey | null {
  const lower = text.toLowerCase();
  for (const [key, phrases] of Object.entries(KEYWORD_MAP) as [DistortionKey, string[]][]) {
    if (phrases.some((phrase) => lower.includes(phrase))) {
      return key;
    }
  }
  return null;
}
