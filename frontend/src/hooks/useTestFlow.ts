import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTest } from "./useTests";
import { uuidv7 } from "@moodly/shared";
import { computeScore, resolveInterpretation, type Interpretation } from "@moodly/shared";
import { enqueue } from "../lib/offline/sync";
import { encryptTestResultPayload } from "../lib/crypto/records";
import type { components } from "../lib/api-types";

type Test = components["schemas"]["Test"];

export interface ResultFlags {
  distortions?: Record<string, { score: number; level: string }>;
  templateKey?: string;
  recommendationKey?: string;
  highKeys?: string[];
  moderateKeys?: string[];
  bandKey?: string;
}

interface ResultData {
  score: number;
  interpretation: string;
  recommendation: string;
  flags?: ResultFlags;
}

async function scoreLocally(
  test: Test,
  answers: { questionId: string; optionId: string }[],
): Promise<Interpretation & { score: number; maxScore: number }> {
  const { score, maxScore } = computeScore(test.questions, answers);
  const interpretation = resolveInterpretation({
    testType: test.type,
    score,
    maxScore,
    answers,
    bands: test.scoreBands.map((b) => ({
      maxScore: b.maxScore,
      key: b.key,
      interpretation: b.interpretation,
      recommendation: b.recommendation,
    })),
  });
  return { ...interpretation, score, maxScore };
}

export function useTestFlow(testId?: string) {
  const { data: test, isLoading } = useTest(testId);
  const queryClient = useQueryClient();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string }[]>([]);
  const [result, setResult] = useState<ResultData | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAnswer = answers[questionIndex];

  const handleAnswer = useCallback(
    (optionId: string) => {
      setAnswers((prev) => {
        const next = [...prev];
        if (next.length > questionIndex) {
          next[questionIndex] = { questionId: test!.questions[questionIndex].id, optionId };
        } else {
          next.push({ questionId: test!.questions[questionIndex].id, optionId });
        }
        return next;
      });
    },
    [questionIndex, test],
  );

  const handleSubmit = useCallback(async () => {
    if (!test || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const interpreted = await scoreLocally(test, answers);
      const resultId = uuidv7();
      const encryptedData = await encryptTestResultPayload(
        {
          score: interpreted.score,
          maxScore: interpreted.maxScore,
          interpretation: interpreted.interpretation,
          recommendation: interpreted.recommendation,
          flags: (interpreted.flags ?? {}) as Record<string, unknown>,
        },
        resultId,
      );
      await enqueue("testResult", "upsert", resultId, {
        testId: test.id,
        encryptedData,
        completedAt: new Date().toISOString(),
      });
      setResult({
        score: interpreted.score,
        interpretation: interpreted.interpretation,
        recommendation: interpreted.recommendation,
        flags: interpreted.flags as ResultFlags,
      });
      queryClient.invalidateQueries({ queryKey: ["testResults"] });
    } finally {
      setIsSubmitting(false);
    }
  }, [test, answers, isSubmitting, queryClient]);

  const handleNext = useCallback(() => {
    if (questionIndex === test!.questions.length - 1) {
      void handleSubmit();
      return;
    }
    setQuestionIndex((i) => i + 1);
  }, [questionIndex, test, handleSubmit]);

  const handleBack = useCallback(() => {
    if (questionIndex > 0) setQuestionIndex((i) => i - 1);
  }, [questionIndex]);

  return {
    test,
    isLoading,
    isSubmitting,
    questionIndex,
    answers,
    currentAnswer,
    result,
    showExitConfirm,
    setShowExitConfirm,
    handleAnswer,
    handleNext,
    handleBack,
    handleSubmit,
  };
}
