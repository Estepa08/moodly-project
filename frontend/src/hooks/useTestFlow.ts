import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const SUICIDE_QUESTION_IDS = ["phq9-9", "bdc-23", "bdc-24", "bdc-25"];

export function useTestFlow(testId?: string) {
  const navigate = useNavigate();
  const { data: test, isLoading } = useTest(testId);
  const submitMutation = useSubmitTestResult(testId);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string }[]>([]);
  const [result, setResult] = useState<ResultData | null>(null);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [crisisDialogOpen, setCrisisDialogOpen] = useState(false);
  const [showReview, setShowReview] = useState(false);
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
      setShowReview(true);
      return;
    }
    const nextIdx = questionIndex + 1;
    const isNextSuicide = SUICIDE_QUESTION_IDS.includes(test!.questions[nextIdx]?.id || "");
    if (isNextSuicide && !showContentWarning) {
      setShowContentWarning(true);
      return;
    }
    setQuestionIndex(nextIdx);
  }, [questionIndex, test, showContentWarning]);

  const handleBack = useCallback(() => {
    if (questionIndex > 0) setQuestionIndex((i) => i - 1);
  }, [questionIndex]);

  const handleContinueFromWarning = useCallback(() => {
    setShowContentWarning(false);
    setQuestionIndex((i) => i + 1);
  }, []);

  const handleSkipFromWarning = useCallback(() => {
    setShowContentWarning(false);
    navigate("/tests");
  }, [navigate]);

  const handleSubmit = useCallback(() => {
    submitMutation.mutate(answers, {
      onSuccess: (data) => {
        setResult(data as ResultData);
        if (getCrisisSeverityFromRecommendation((data as ResultData).recommendation)) {
          setCrisisDialogOpen(true);
        }
      },
    });
  }, [answers, submitMutation]);

  const handleGoToQuestion = useCallback((idx: number) => {
    setQuestionIndex(idx);
    setShowReview(false);
  }, []);

  return {
    test,
    isLoading,
    submitMutation,
    questionIndex,
    answers,
    currentAnswer,
    result,
    showContentWarning,
    crisisDialogOpen,
    showReview,
    showExitConfirm,
    setShowReview,
    setShowExitConfirm,
    setCrisisDialogOpen,
    handleAnswer,
    handleNext,
    handleBack,
    handleContinueFromWarning,
    handleSkipFromWarning,
    handleSubmit,
    handleGoToQuestion,
  };
}

function getCrisisSeverityFromRecommendation(recommendation: string): boolean {
  return recommendation.startsWith("CRITICAL") || recommendation.startsWith("URGENT");
}
