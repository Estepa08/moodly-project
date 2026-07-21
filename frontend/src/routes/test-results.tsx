import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import Spinner from "../components/ui/spinner";
import { useTestTranslation } from "../hooks/useTestTranslation";

interface TestResult {
  id: string;
  testId: string;
  score: number;
  interpretation: string;
  recommendation: string;
  completedAt: string;
  flags?: {
    distortions?: Record<string, { score: number; level: string }>;
    templateKey?: string;
    recommendationKey?: string;
    highKeys?: string[];
    moderateKeys?: string[];
  };
}

interface Test {
  id: string;
  title: string;
}

export default function TestResultsPage() {
  const { t, i18n } = useTranslation();
  const {
    tInterpretation,
    tRecommendation,
    tTestTitle,
    tCDInterpretation,
    tCDRecommendation,
  } = useTestTranslation();
  const [showFull, setShowFull] = useState<Record<string, boolean>>({});
  const [showRec, setShowRec] = useState<Record<string, boolean>>({});

  const { data: tests } = useQuery<Test[]>({
    queryKey: ["tests"],
    queryFn: () => api.tests.list() as Promise<Test[]>,
  });

  const { data: results, isLoading } = useQuery<TestResult[]>({
    queryKey: ["test-results"],
    queryFn: () => api.testResults.list() as Promise<TestResult[]>,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  const testMap = new Map(tests?.map((t) => [t.id, t.title]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-primary">{t("testResults.title")}</h1>

      {results?.length === 0 && (
        <p className="text-muted-foreground text-center py-8">{t("testResults.noResults")}</p>
      )}

      {results?.map((r) => {
        const isCD = !!r.flags?.templateKey;
        const cdFlags = r.flags;
        const interpretationText =
          isCD && cdFlags
            ? tCDInterpretation(
                cdFlags.templateKey!,
                cdFlags.highKeys || [],
                cdFlags.moderateKeys || [],
                r.interpretation,
              )
            : tInterpretation(r.interpretation);
        const recommendationText =
          isCD && cdFlags
            ? tCDRecommendation(cdFlags.recommendationKey || "minimal", r.recommendation)
            : tRecommendation(r.recommendation);

        const isLongText = isCD || interpretationText.length > 100;
        const highKeys = r.flags?.highKeys || [];
        const moderateKeys = r.flags?.moderateKeys || [];

        return (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <p className="text-xs text-muted-foreground">
                {tTestTitle(testMap.get(r.testId) || "")} &middot;{" "}
                {new Date(r.completedAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-card shadow-neumorphic-sm flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{r.score}</span>
                </div>
              </div>

              {isCD && cdFlags && (highKeys.length > 0 || moderateKeys.length > 0) && (
                <div className="space-y-2 mb-3">
                  {highKeys.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {i18n.language.startsWith("ru") ? "Выражены:" : "High:"}
                      </span>
                      {highKeys.map((key) => (
                        <span
                          key={key}
                          className="inline-block px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive"
                        >
                          {t(`cognitiveDistortions.${key}`)}
                        </span>
                      ))}
                    </div>
                  )}
                  {moderateKeys.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {i18n.language.startsWith("ru") ? "Умеренно:" : "Moderate:"}
                      </span>
                      {moderateKeys.map((key) => (
                        <span
                          key={key}
                          className="inline-block px-2 py-0.5 text-xs rounded-full bg-secondary text-primary"
                        >
                          {t(`cognitiveDistortions.${key}`)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={showFull[r.id] ? "" : "line-clamp-2"}>
                <p className="text-sm">{interpretationText}</p>
              </div>

              {isLongText && (
                <button
                  className="text-xs text-primary hover:underline mt-1 cursor-pointer"
                  onClick={() =>
                    setShowFull((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                  }
                >
                  {showFull[r.id] ? t("testResults.showLess") : t("testResults.showFull")}
                </button>
              )}

              <button
                className="flex items-center gap-1 text-sm text-primary hover:underline mt-3 cursor-pointer"
                onClick={() => setShowRec((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
              >
                <span className={showRec[r.id] ? "rotate-90" : ""}>▸</span>
                {t("testDetail.recommendation")}
              </button>

              {showRec[r.id] && (
                <p className="text-sm text-muted-foreground mt-2">{recommendationText}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
