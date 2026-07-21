import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useState } from "react";

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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; optionId: string }[]>([]);
  const [result, setResult] = useState<{ score: number; interpretation: string; recommendation: string } | null>(null);

  const { data: test } = useQuery<TestData>({
    queryKey: ["test", testId],
    queryFn: () => api.tests.get(testId) as Promise<TestData>,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.tests.submitResult(testId, { answers }),
    onSuccess: (data) => {
      setResult(data as { score: number; interpretation: string; recommendation: string });
    },
  });

  if (result && test) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>{test.title} — Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-moodly-700">{result.score}</div>
              <p className="text-sm text-zinc-500">Score</p>
            </div>
            <div>
              <p className="font-medium">Interpretation</p>
              <p className="text-zinc-600">{result.interpretation}</p>
            </div>
            <div>
              <p className="font-medium">Recommendation</p>
              <p className="text-zinc-600">{result.recommendation}</p>
            </div>
            <Button className="w-full" onClick={() => navigate("test-results")}>View All Results</Button>
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
        <h1 className="text-lg font-semibold text-moodly-700">{test.title}</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate("tests")}>Exit</Button>
      </header>

      <div className="flex gap-1">
        {test.questions.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= questionIndex ? "bg-moodly-600" : "bg-zinc-200"}`} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{question.text}</CardTitle>
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
              {option.text}
            </Button>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-400 text-center">
        Question {questionIndex + 1} of {test.questions.length}
      </p>
    </div>
  );
}
