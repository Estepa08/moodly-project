import { DistortionKey } from "./distortionsQuiz";

const KEYWORD_MAP: Record<DistortionKey, string[]> = {
  [DistortionKey.AllOrNothing]: ["always fail", "total failure", "ruined everything", "complete disaster"],
  [DistortionKey.Overgeneralization]: ["always", "never", "every time", "everyone", "nobody"],
  [DistortionKey.MentalFilter]: ["only thing", "can't stop thinking", "one bad", "just focus on"],
  [DistortionKey.DiscountingPositive]: ["doesn't count", "wasn't real", "just luck", "anyone could"],
  [DistortionKey.JumpingToConclusions]: ["they think", "must hate", "going to fail", "knows i"],
  [DistortionKey.Magnification]: ["ruin", "disaster", "terrible", "catastrophe", "the end of"],
  [DistortionKey.EmotionalReasoning]: ["i feel like", "must be true because i feel", "feels like i am"],
  [DistortionKey.ShouldStatements]: ["should have", "must be", "have to be", "ought to"],
  [DistortionKey.Labeling]: ["i'm such a", "i am a failure", "i'm stupid", "i'm a loser"],
  [DistortionKey.Personalization]: ["my fault", "because of me", "i caused", "i'm to blame"],
};

export function suggestDistortion(text: string): DistortionKey | null {
  const lower = text.toLowerCase();
  for (const [key, phrases] of Object.entries(KEYWORD_MAP) as [DistortionKey, string[]][]) {
    if (phrases.some((phrase) => lower.includes(phrase))) {
      return key;
    }
  }
  return null;
}
