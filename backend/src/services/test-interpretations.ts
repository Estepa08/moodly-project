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

const interpretations: Record<string, InterpretFn> = {
  "PHQ-9": (score, _maxScore, answers) => {
    const flags: Record<string, unknown> = {};

    const suicideQuestionId = "phq9-9";
    for (const answer of answers) {
      if (answer.questionId === suicideQuestionId) {
        const optionIdNum = parseInt(answer.optionId.split("-").pop() || "0", 10);
        if (optionIdNum > 0) {
          flags.suicidalIdeation = true;
          if (optionIdNum >= 2) {
            flags.suicidalPlan = true;
          }
        }
      }
    }

    let interpretation: string;
    let recommendation: string;

    if (score <= 4) {
      interpretation = "Minimal depression";
      recommendation = "No action needed. Continue monitoring.";
    } else if (score <= 9) {
      interpretation = "Mild depression";
      recommendation = "Monitor symptoms. Consider self-help techniques, exercise, and sleep hygiene.";
    } else if (score <= 14) {
      interpretation = "Moderate depression";
      recommendation = "Consider consulting a therapist. Therapy and/or pharmacotherapy may be beneficial.";
    } else if (score <= 19) {
      interpretation = "Moderately severe depression";
      recommendation = "We recommend consulting a mental health professional. Combined therapy and medication may be most effective.";
    } else {
      interpretation = "Severe depression";
      recommendation = "We strongly recommend consulting a mental health professional immediately. Active treatment is needed.";
    }

    if (flags.suicidalIdeation) {
      recommendation = "URGENT: This assessment indicates thoughts of self-harm. Please contact a crisis helpline immediately or go to the nearest emergency room.";
      if (flags.suicidalPlan) {
        recommendation = "CRITICAL: This assessment indicates active suicidal thoughts. Immediate emergency intervention is required. Call emergency services (911/112) or go to the nearest emergency room right now.";
      }
    }

    return { interpretation, recommendation, flags: Object.keys(flags).length > 0 ? flags : undefined };
  },

  "GAD-7": (score) => {
    if (score <= 4) return { interpretation: "Minimal anxiety", recommendation: "No action needed. Continue monitoring." };
    if (score <= 9) return { interpretation: "Mild anxiety", recommendation: "Monitor symptoms. Consider self-help techniques." };
    if (score <= 14) return { interpretation: "Moderate anxiety", recommendation: "Consider consulting a therapist. Therapy or counseling may be beneficial." };
    return { interpretation: "Severe anxiety", recommendation: "We recommend consulting a mental health professional for evaluation and treatment." };
  },

  "Burns Anxiety Inventory": (score) => {
    if (score <= 4) return { interpretation: "Minimal or no anxiety", recommendation: "No action needed. Keep a simple mood log to reinforce what's working." };
    if (score <= 10) return { interpretation: "Borderline anxiety", recommendation: "Try decatastrophizing: write down your worst-case scenario and rate how likely and how bad it really is." };
    if (score <= 20) return { interpretation: "Mild anxiety", recommendation: "Practice the Triple Column Technique: write the anxious thought, name the distortion, then craft a rational response. Breathing exercises can help in the moment." };
    if (score <= 30) return { interpretation: "Moderate anxiety", recommendation: "Build a gradual exposure list from least to most feared situations and work through it step by step. Professional consultation is advised." };
    if (score <= 50) return { interpretation: "Severe anxiety", recommendation: "Combine self-help techniques with professional support — a therapist can guide exposure and cognitive work safely." };
    return { interpretation: "Extreme anxiety or panic", recommendation: "Immediate professional intervention strongly advised." };
  },

  "Burns Depression Checklist": (score, _maxScore, answers) => {
    const flags: Record<string, unknown> = {};

    const suicidalQuestions = ["bdc-23", "bdc-24", "bdc-25"];
    for (const answer of answers) {
      if (suicidalQuestions.includes(answer.questionId)) {
        const optionIdNum = parseInt(answer.optionId.split("-").pop() || "0", 10);
        if (optionIdNum > 0) {
          flags.suicidalIdeation = true;
          if (answer.questionId === "bdc-25" && optionIdNum > 0) {
            flags.suicidalPlan = true;
          }
        }
      }
    }

    let interpretation: string;
    let recommendation: string;

    if (score <= 5) {
      interpretation = "No depression";
      recommendation = "No depression indicated. A daily mood log can help you notice patterns early.";
    } else if (score <= 10) {
      interpretation = "Normal but unhappy";
      recommendation = "Try a cost-benefit analysis of a recurring negative belief: what does it give you, and what does it cost you?";
    } else if (score <= 25) {
      interpretation = "Mild depression";
      recommendation = "Use the Triple Column Technique and the Double Standard method: would you say this to a friend? Consider therapy if it persists.";
    } else if (score <= 50) {
      interpretation = "Moderate depression";
      recommendation = "Add behavioral activation: schedule small enjoyable or productive activities each day, even if motivation is low. Professional treatment is recommended.";
    } else if (score <= 75) {
      interpretation = "Severe depression";
      recommendation = "Strongly recommend professional intervention — self-help techniques can support but not replace treatment at this level.";
    } else {
      interpretation = "Extreme depression";
      recommendation = "Urgent professional care is strongly advised.";
    }

    if (flags.suicidalIdeation) {
      recommendation = "URGENT: This assessment indicates thoughts of self-harm. Please contact a crisis helpline immediately or go to the nearest emergency room.";
      if (flags.suicidalPlan) {
        recommendation = "CRITICAL: This assessment indicates a plan for self-harm. Immediate emergency intervention is required. Call emergency services (911/112) or go to the nearest emergency room right now.";
      }
    }

    return { interpretation, recommendation, flags: Object.keys(flags).length > 0 ? flags : undefined };
  },

  "Cognitive Distortions Assessment": (score, _maxScore, answers) => {
    const DISTORTIONS = [
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

    const distortions: Record<string, { score: number; level: string }> = {};

    for (let i = 0; i < 10; i++) {
      const d = DISTORTIONS[i];
      const s = distortionScores[i];
      const qc = questionCount[i];
      const ratio = qc > 0 ? s / (qc * 3) : 0;
      let level = "low";
      if (ratio > 0.66) level = "high";
      else if (ratio > 0.33) level = "moderate";
      distortions[d.key] = { score: s, level };
    }

    const highKeys = DISTORTIONS.filter((_, i) => {
      const qc = questionCount[i];
      return qc > 0 && distortionScores[i] / (qc * 3) > 0.66;
    }).map((d) => d.key);

    const moderateKeys = DISTORTIONS.filter((_, i) => {
      const qc = questionCount[i];
      if (qc === 0) return false;
      const r = distortionScores[i] / (qc * 3);
      return r > 0.33 && r <= 0.66;
    }).map((d) => d.key);

    const templateKey = highKeys.length > 0 ? "severe" : moderateKeys.length > 0 ? "moderate" : "minimal";
    const highNames = highKeys.map((k) => DISTORTIONS.find((d) => d.key === k)!.name);
    const moderateNames = moderateKeys.map((k) => DISTORTIONS.find((d) => d.key === k)!.name);

    let interpretation: string;
    if (templateKey === "severe") {
      interpretation = `Significant ${highNames.join(", ")}. ${
        moderateNames.length > 0 ? `Moderate ${moderateNames.join(", ")}. ` : ""
      }Consider working on these thinking patterns with CBT techniques.`;
    } else if (templateKey === "moderate") {
      interpretation = `Moderate ${moderateNames.join(", ")}. Awareness of these distortions is the first step to change.`;
    } else {
      interpretation = "Minimal cognitive distortions detected. Your thinking patterns appear balanced.";
    }

    let recommendation: string;
    let recommendationKey: string;
    if (templateKey === "severe") {
      recommendation = "Your results indicate several strongly held cognitive distortions. Cognitive Behavioral Therapy (CBT) is highly effective for addressing these patterns. Consider journaling your thoughts and challenging distorted thinking with evidence.";
      recommendationKey = "severe";
    } else if (templateKey === "moderate") {
      recommendation = "You show some tendency toward cognitive distortions. Try keeping a thought record and practicing cognitive restructuring techniques.";
      recommendationKey = "moderate";
    } else {
      recommendation = "No significant cognitive distortions detected. Continue practicing balanced thinking.";
      recommendationKey = "minimal";
    }

    return {
      interpretation,
      recommendation,
      flags: {
        distortions,
        templateKey,
        recommendationKey,
        highKeys,
        moderateKeys,
      },
    };
  },
};

export function getInterpretation(testTitle: string, score: number, maxScore: number, answers: TestAnswer[]): Interpretation {
  const fn = interpretations[testTitle];
  if (fn) return fn(score, maxScore, answers);

  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio < 0.33) return { interpretation: "Low score", recommendation: "No immediate concerns, continue monitoring." };
  if (ratio < 0.66) return { interpretation: "Moderate score", recommendation: "Consider discussing with a specialist if symptoms persist." };
  return { interpretation: "Elevated score", recommendation: "We recommend consulting a mental health professional." };
}
