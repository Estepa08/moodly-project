import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useState } from "react";
import { useTestTranslation } from "../hooks/useTestTranslation";
import RadarChart from "../components/RadarChart";
import type { DistortionEntry } from "../components/RadarChart";

interface TestData {
  id: string;
  title: string;
  description?: string;
  questions: {
    id: string;
    text: string;
    options: { id: string; text: string; score: number }[];
  }[];
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
  testId: string;
}

export default function TestDetailPage({ navigate, testId }: Props) {
  const { t } = useTranslation();
  const { tQuestion, tOption, tInterpretation, tRecommendation, tTestTitle, tCDInterpretation, tCDRecommendation } = useTestTranslation();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string }[]>([]);

  interface ResultData {
    score: number;
    interpretation: string;
    recommendation: string;
    flags?: {
      distortions?: Record<string, { score: number; level: string }>;
      templateKey?: string;
      recommendationKey?: string;
      highKeys?: string[];
      moderateKeys?: string[];
    };
  }

  const [result, setResult] = useState<ResultData | null>(null);

  const { data: test } = useQuery<TestData>({
    queryKey: ["test", testId],
    queryFn: () => api.tests.get(testId) as Promise<TestData>,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.tests.submitResult(testId, { answers }),
    onSuccess: (data) => {
      setResult(data as ResultData);
    },
  });

  const cdDistortions = result?.flags?.distortions;
  const cdKeys = cdDistortions ? Object.keys(cdDistortions) : [];

  if (result && test) {
    const cdFlags = result.flags;
    const isCD = cdFlags?.templateKey !== undefined;
    const interpretationText = isCD && cdFlags
      ? tCDInterpretation(cdFlags.templateKey!, cdFlags.highKeys || [], cdFlags.moderateKeys || [], result.interpretation)
      : tInterpretation(result.interpretation);
    const recommendationText = isCD && cdFlags
      ? tCDRecommendation(cdFlags.recommendationKey || "minimal", result.recommendation)
      : tRecommendation(result.recommendation);
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>{tTestTitle(test.title)} — {t("testDetail.result")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{result.score}</div>
              <p className="text-sm text-muted-foreground">{t("testDetail.score")}</p>
            </div>
            <div>
              <p className="font-medium">{t("testDetail.interpretation")}</p>
              <p className="text-muted-foreground">{interpretationText}</p>
            </div>
            {cdDistortions && cdKeys.length > 0 && (
              <div>
                <p className="font-medium mb-2">{t("cognitiveDistortions.yourProfile")}</p>
                <RadarChart
                  data={cdKeys.map((key) => ({ key, score: cdDistortions[key].score }))}
                />
              </div>
            )}
            <div>
              <p className="font-medium">{t("testDetail.recommendation")}</p>
              <p className="text-muted-foreground">{recommendationText}</p>
            </div>
            <Button className="w-full" onClick={() => navigate("test-results")}>{t("testDetail.viewAll")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!test) return null;

  const question = test.questions[questionIndex];
  const isLast = questionIndex === test.questions.length - 1;

  const handleAnswer = (optionId: string) => {
    const newAnswers = [...answers, { questionId: question.id, optionId }];
    setAnswers(newAnswers);

    if (isLast) {
      submitMutation.mutate();
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-primary">{tTestTitle(test.title)}</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate("tests")}>{t("testDetail.exit")}</Button>
      </header>

      <div className="flex gap-1">
        {test.questions.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= questionIndex ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{tQuestion(question.id, question.text)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {question.options.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="w-full justify-start h-auto py-3 px-4"
              onClick={() => handleAnswer(option.id)}
              disabled={submitMutation.isPending}
            >
              {tOption(option.id, option.text)}
            </Button>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {t("testDetail.questionProgress", { current: questionIndex + 1, total: test.questions.length })}
      </p>
    </div>
  );
}
