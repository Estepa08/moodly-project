import { useState, useCallback } from "react";
import { useTest, useSubmitTestResult } from "./useTests";

interface ResultFlags {
  distortions?: Record<string, { score: number; level: string }>;
  templateKey?: string;
  recommendationKey?: string;
  highKeys?: string[];
  moderateKeys?: string[];
}

interface ResultData {
  score: number;
  interpretation: string;
  recommendation: string;
  flags?: ResultFlags;
}

export function useTestFlow(testId?: string) {
  const { data: test, isLoading } = useTest(testId);
  const submitMutation = useSubmitTestResult(testId);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string }[]>([]);
  const [result, setResult] = useState<ResultData | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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

  const handleNext = useCallback(() => {
    if (questionIndex === test!.questions.length - 1) {
      submitMutation.mutate(answers, {
        onSuccess: (data) => {
          setResult(data as ResultData);
        },
      });
      return;
    }
    setQuestionIndex((i) => i + 1);
  }, [questionIndex, test, answers, submitMutation]);

  const handleBack = useCallback(() => {
    if (questionIndex > 0) setQuestionIndex((i) => i - 1);
  }, [questionIndex]);

  const handleSubmit = useCallback(() => {
    submitMutation.mutate(answers, {
      onSuccess: (data) => {
        setResult(data as ResultData);
      },
    });
  }, [answers, submitMutation]);

  return {
    test,
    isLoading,
    submitMutation,
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
