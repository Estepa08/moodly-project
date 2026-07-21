import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useTestTranslation } from "../hooks/useTestTranslation";

interface TestResult {
  id: string;
  testId: string;
  score: number;
  interpretation: string;
  recommendation: string;
  completedAt: string;
  flags?: { distortions?: Record<string, { score: number; level: string }> };
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
}

export default function TestResultsPage({ navigate }: Props) {
  const { t, i18n } = useTranslation();
  const { tInterpretation, tRecommendation } = useTestTranslation();
  const { data: results } = useQuery<TestResult[]>({
    queryKey: ["test-results"],
    queryFn: () => api.testResults.list() as Promise<TestResult[]>,
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">{t("testResults.title")}</h1>
        <Button variant="ghost" onClick={() => navigate("dashboard")}>{t("common.back")}</Button>
      </header>

      {results?.length === 0 && (
        <p className="text-muted-foreground text-center py-8">{t("testResults.noResults")}</p>
      )}

      {results?.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{tInterpretation(r.interpretation)}</span>
              <span className="text-sm font-mono text-primary">{r.score}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{new Date(r.completedAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{tRecommendation(r.recommendation)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
