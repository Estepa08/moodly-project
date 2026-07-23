export interface ScoreBand {
  maxScore: number;
  key: string;
  interpretation: string;
  recommendation: string;
}

// Tertile split of a 0-1 normalized score into low/moderate/high (or generic
// low/moderate/elevated) bands: bottom third, middle third, top third.
// Used both for the Cognitive Distortions per-item ratios and the generic
// score fallback below — not a clinically defined cutoff, just an even split.
export const RATIO_LOW_MAX = 1 / 3;
export const RATIO_MODERATE_MAX = 2 / 3;

export const CRISIS_MESSAGES = {
  urgent:
    "URGENT: This assessment indicates thoughts of self-harm. Please contact a crisis helpline immediately or go to the nearest emergency room.",
  criticalActiveThoughts:
    "CRITICAL: This assessment indicates active suicidal thoughts. Immediate emergency intervention is required. Call emergency services (911/112) or go to the nearest emergency room right now.",
  criticalPlan:
    "CRITICAL: This assessment indicates a plan for self-harm. Immediate emergency intervention is required. Call emergency services (911/112) or go to the nearest emergency room right now.",
};

// PHQ-9 (Patient Health Questionnaire-9) severity cutoffs.
// Source: Kroenke K, Spitzer RL, Williams JB. "The PHQ-9: validity of a brief
// depression severity measure." J Gen Intern Med. 2001;16(9):606-13.
export const PHQ9_BANDS: ScoreBand[] = [
  {
    maxScore: 4,
    key: "minimal",
    interpretation: "Minimal depression",
    recommendation: "No action needed. Continue monitoring.",
  },
  {
    maxScore: 9,
    key: "mild",
    interpretation: "Mild depression",
    recommendation: "Monitor symptoms. Consider self-help techniques, exercise, and sleep hygiene.",
  },
  {
    maxScore: 14,
    key: "moderate",
    interpretation: "Moderate depression",
    recommendation:
      "Consider consulting a therapist. Therapy and/or pharmacotherapy may be beneficial.",
  },
  {
    maxScore: 19,
    key: "moderatelySevere",
    interpretation: "Moderately severe depression",
    recommendation:
      "We recommend consulting a mental health professional. Combined therapy and medication may be most effective.",
  },
  {
    maxScore: Infinity,
    key: "severe",
    interpretation: "Severe depression",
    recommendation:
      "We strongly recommend consulting a mental health professional immediately. Active treatment is needed.",
  },
];

// GAD-7 (Generalized Anxiety Disorder-7) severity cutoffs.
// Source: Spitzer RL, Kroenke K, Williams JB, Löwe B. "A brief measure for
// assessing generalized anxiety disorder: the GAD-7." Arch Intern Med. 2006;166(10):1092-7.
export const GAD7_BANDS: ScoreBand[] = [
  {
    maxScore: 4,
    key: "minimal",
    interpretation: "Minimal anxiety",
    recommendation: "No action needed. Continue monitoring.",
  },
  {
    maxScore: 9,
    key: "mild",
    interpretation: "Mild anxiety",
    recommendation: "Monitor symptoms. Consider self-help techniques.",
  },
  {
    maxScore: 14,
    key: "moderate",
    interpretation: "Moderate anxiety",
    recommendation: "Consider consulting a therapist. Therapy or counseling may be beneficial.",
  },
  {
    maxScore: Infinity,
    key: "severe",
    interpretation: "Severe anxiety",
    recommendation:
      "We recommend consulting a mental health professional for evaluation and treatment.",
  },
];

// Burns Anxiety Inventory (BAI) severity cutoffs, as popularized in
// David D. Burns, "When Panic Attacks" / "Feeling Good" self-help scales.
export const BURNS_ANXIETY_BANDS: ScoreBand[] = [
  {
    maxScore: 4,
    key: "minimal",
    interpretation: "Minimal or no anxiety",
    recommendation: "No action needed. Keep a simple mood log to reinforce what's working.",
  },
  {
    maxScore: 10,
    key: "borderline",
    interpretation: "Borderline anxiety",
    recommendation:
      "Try decatastrophizing: write down your worst-case scenario and rate how likely and how bad it really is.",
  },
  {
    maxScore: 20,
    key: "mild",
    interpretation: "Mild anxiety",
    recommendation:
      "Practice the Triple Column Technique: write the anxious thought, name the distortion, then craft a rational response. Breathing exercises can help in the moment.",
  },
  {
    maxScore: 30,
    key: "moderate",
    interpretation: "Moderate anxiety",
    recommendation:
      "Build a gradual exposure list from least to most feared situations and work through it step by step. Professional consultation is advised.",
  },
  {
    maxScore: 50,
    key: "severe",
    interpretation: "Severe anxiety",
    recommendation:
      "Combine self-help techniques with professional support — a therapist can guide exposure and cognitive work safely.",
  },
  {
    maxScore: Infinity,
    key: "extreme",
    interpretation: "Extreme anxiety or panic",
    recommendation: "Immediate professional intervention strongly advised.",
  },
];

// Burns Depression Checklist (BDC) severity cutoffs, as popularized in
// David D. Burns, "Feeling Good: The New Mood Therapy" self-help scale.
export const BURNS_DEPRESSION_BANDS: ScoreBand[] = [
  {
    maxScore: 5,
    key: "none",
    interpretation: "No depression",
    recommendation: "No depression indicated. A daily mood log can help you notice patterns early.",
  },
  {
    maxScore: 10,
    key: "normalUnhappy",
    interpretation: "Normal but unhappy",
    recommendation:
      "Try a cost-benefit analysis of a recurring negative belief: what does it give you, and what does it cost you?",
  },
  {
    maxScore: 25,
    key: "mild",
    interpretation: "Mild depression",
    recommendation:
      "Use the Triple Column Technique and the Double Standard method: would you say this to a friend? Consider therapy if it persists.",
  },
  {
    maxScore: 50,
    key: "moderate",
    interpretation: "Moderate depression",
    recommendation:
      "Add behavioral activation: schedule small enjoyable or productive activities each day, even if motivation is low. Professional treatment is recommended.",
  },
  {
    maxScore: 75,
    key: "severe",
    interpretation: "Severe depression",
    recommendation:
      "Strongly recommend professional intervention — self-help techniques can support but not replace treatment at this level.",
  },
  {
    maxScore: Infinity,
    key: "extreme",
    interpretation: "Extreme depression",
    recommendation: "Urgent professional care is strongly advised.",
  },
];

// Fallback for any test not covered by a named scale above: an even tertile
// split of score/maxScore, not a clinically validated cutoff.
export const GENERIC_RATIO_BANDS: {
  maxRatio: number;
  key: string;
  interpretation: string;
  recommendation: string;
}[] = [
  {
    maxRatio: RATIO_LOW_MAX,
    key: "low",
    interpretation: "Low score",
    recommendation: "No immediate concerns, continue monitoring.",
  },
  {
    maxRatio: RATIO_MODERATE_MAX,
    key: "moderate",
    interpretation: "Moderate score",
    recommendation: "Consider discussing with a specialist if symptoms persist.",
  },
  {
    maxRatio: Infinity,
    key: "elevated",
    interpretation: "Elevated score",
    recommendation: "We recommend consulting a mental health professional.",
  },
];

export const DISTORTIONS = [
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
] as const;

export function cdInterpretation(
  templateKey: "severe" | "moderate" | "minimal",
  highNames: string[],
  moderateNames: string[],
): string {
  if (templateKey === "severe") {
    return `Significant ${highNames.join(", ")}. ${
      moderateNames.length > 0 ? `Moderate ${moderateNames.join(", ")}. ` : ""
    }Consider working on these thinking patterns with CBT techniques.`;
  }
  if (templateKey === "moderate") {
    return `Moderate ${moderateNames.join(", ")}. Awareness of these distortions is the first step to change.`;
  }
  return "Minimal cognitive distortions detected. Your thinking patterns appear balanced.";
}

export function cdRecommendation(recommendationKey: "severe" | "moderate" | "minimal"): string {
  if (recommendationKey === "severe") {
    return "Your results indicate several strongly held cognitive distortions. Cognitive Behavioral Therapy (CBT) is highly effective for addressing these patterns. Consider journaling your thoughts and challenging distorted thinking with evidence.";
  }
  if (recommendationKey === "moderate") {
    return "You show some tendency toward cognitive distortions. Try keeping a thought record and practicing cognitive restructuring techniques.";
  }
  return "No significant cognitive distortions detected. Continue practicing balanced thinking.";
}
