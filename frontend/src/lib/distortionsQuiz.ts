export const DISTORTION_KEYS = [
  "allOrNothing",
  "overgeneralization",
  "mentalFilter",
  "discountingPositive",
  "jumpingToConclusions",
  "magnification",
  "emotionalReasoning",
  "shouldStatements",
  "labeling",
  "personalization",
] as const;

export type DistortionKey = (typeof DISTORTION_KEYS)[number];

export const QUIZ_PER_RUN = 7;

export const QUIZ_ITEMS: { id: string; distortion: DistortionKey }[] = [
  { id: "q1", distortion: "allOrNothing" },
  { id: "q2", distortion: "overgeneralization" },
  { id: "q3", distortion: "mentalFilter" },
  { id: "q4", distortion: "discountingPositive" },
  { id: "q5", distortion: "jumpingToConclusions" },
  { id: "q6", distortion: "magnification" },
  { id: "q7", distortion: "emotionalReasoning" },
  { id: "q8", distortion: "shouldStatements" },
  { id: "q9", distortion: "labeling" },
  { id: "q10", distortion: "personalization" },
  { id: "q11", distortion: "allOrNothing" },
  { id: "q12", distortion: "jumpingToConclusions" },
  { id: "q13", distortion: "overgeneralization" },
  { id: "q14", distortion: "shouldStatements" },
  { id: "q15", distortion: "mentalFilter" },
  { id: "q16", distortion: "allOrNothing" },
  { id: "q17", distortion: "overgeneralization" },
  { id: "q18", distortion: "mentalFilter" },
  { id: "q19", distortion: "discountingPositive" },
  { id: "q20", distortion: "discountingPositive" },
  { id: "q21", distortion: "jumpingToConclusions" },
  { id: "q22", distortion: "magnification" },
  { id: "q23", distortion: "magnification" },
  { id: "q24", distortion: "emotionalReasoning" },
  { id: "q25", distortion: "emotionalReasoning" },
  { id: "q26", distortion: "shouldStatements" },
  { id: "q27", distortion: "labeling" },
  { id: "q28", distortion: "labeling" },
  { id: "q29", distortion: "personalization" },
  { id: "q30", distortion: "personalization" },
  { id: "q31", distortion: "allOrNothing" },
  { id: "q32", distortion: "overgeneralization" },
  { id: "q33", distortion: "mentalFilter" },
  { id: "q34", distortion: "discountingPositive" },
  { id: "q35", distortion: "jumpingToConclusions" },
  { id: "q36", distortion: "magnification" },
  { id: "q37", distortion: "emotionalReasoning" },
  { id: "q38", distortion: "shouldStatements" },
  { id: "q39", distortion: "labeling" },
  { id: "q40", distortion: "personalization" },
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
  const others = shuffle(DISTORTION_KEYS.filter((k) => k !== correct)).slice(0, 3);
  return shuffle([correct, ...others]);
}
