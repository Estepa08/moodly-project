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
