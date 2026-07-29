export enum DistortionKey {
  AllOrNothing = "allOrNothing",
  Overgeneralization = "overgeneralization",
  MentalFilter = "mentalFilter",
  DiscountingPositive = "discountingPositive",
  JumpingToConclusions = "jumpingToConclusions",
  Magnification = "magnification",
  EmotionalReasoning = "emotionalReasoning",
  ShouldStatements = "shouldStatements",
  Labeling = "labeling",
  Personalization = "personalization",
}

export const DISTORTION_KEYS = Object.values(DistortionKey);

export const QUIZ_PER_RUN = 7;

export const QUIZ_ITEMS: { id: string; distortion: DistortionKey }[] = [
  { id: "q1", distortion: DistortionKey.AllOrNothing },
  { id: "q2", distortion: DistortionKey.Overgeneralization },
  { id: "q3", distortion: DistortionKey.MentalFilter },
  { id: "q4", distortion: DistortionKey.DiscountingPositive },
  { id: "q5", distortion: DistortionKey.JumpingToConclusions },
  { id: "q6", distortion: DistortionKey.Magnification },
  { id: "q7", distortion: DistortionKey.EmotionalReasoning },
  { id: "q8", distortion: DistortionKey.ShouldStatements },
  { id: "q9", distortion: DistortionKey.Labeling },
  { id: "q10", distortion: DistortionKey.Personalization },
  { id: "q11", distortion: DistortionKey.AllOrNothing },
  { id: "q12", distortion: DistortionKey.JumpingToConclusions },
  { id: "q13", distortion: DistortionKey.Overgeneralization },
  { id: "q14", distortion: DistortionKey.ShouldStatements },
  { id: "q15", distortion: DistortionKey.MentalFilter },
  { id: "q16", distortion: DistortionKey.AllOrNothing },
  { id: "q17", distortion: DistortionKey.Overgeneralization },
  { id: "q18", distortion: DistortionKey.MentalFilter },
  { id: "q19", distortion: DistortionKey.DiscountingPositive },
  { id: "q20", distortion: DistortionKey.DiscountingPositive },
  { id: "q21", distortion: DistortionKey.JumpingToConclusions },
  { id: "q22", distortion: DistortionKey.Magnification },
  { id: "q23", distortion: DistortionKey.Magnification },
  { id: "q24", distortion: DistortionKey.EmotionalReasoning },
  { id: "q25", distortion: DistortionKey.EmotionalReasoning },
  { id: "q26", distortion: DistortionKey.ShouldStatements },
  { id: "q27", distortion: DistortionKey.Labeling },
  { id: "q28", distortion: DistortionKey.Labeling },
  { id: "q29", distortion: DistortionKey.Personalization },
  { id: "q30", distortion: DistortionKey.Personalization },
  { id: "q31", distortion: DistortionKey.AllOrNothing },
  { id: "q32", distortion: DistortionKey.Overgeneralization },
  { id: "q33", distortion: DistortionKey.MentalFilter },
  { id: "q34", distortion: DistortionKey.DiscountingPositive },
  { id: "q35", distortion: DistortionKey.JumpingToConclusions },
  { id: "q36", distortion: DistortionKey.Magnification },
  { id: "q37", distortion: DistortionKey.EmotionalReasoning },
  { id: "q38", distortion: DistortionKey.ShouldStatements },
  { id: "q39", distortion: DistortionKey.Labeling },
  { id: "q40", distortion: DistortionKey.Personalization },
];

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickOptions(correct: DistortionKey): DistortionKey[] {
  const allValues = Object.values(DistortionKey);
  const others = shuffle(allValues.filter((k) => k !== correct)).slice(0, 3);
  return shuffle([correct, ...others]);
}
