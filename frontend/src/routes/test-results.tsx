import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { ChevronRight, BrainCircuit } from "lucide-react";
import { useTestResults } from "../hooks/useTests";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Chip } from "../components/ui/chip";
import Spinner from "../components/ui/spinner";
import EmptyState from "../components/ui/empty-state";
import { TestResultsChart, RadarChart } from "../features/analytics";
import { usePets } from "../features/gamification";
import { buildRadarComparison } from "../lib/radarDelta";
import { useTestResultText } from "../hooks/useTestResultText";
import { WellnessDisclaimer } from "../widgets";
import StickyBottomBar from "../components/ui/sticky-bottom-bar";

export default function TestResultsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { resolve } = useTestResultText();
  const { data: pets } = usePets();
  const petName = pets?.petName?.trim() || t("testResults.defaultPetName");
  const [showFull, setShowFull] = useState<Record<string, boolean>>({});
  const [showScore, setShowScore] = useState<Record<string, boolean>>({});
  const [showRec, setShowRec] = useState<Record<string, boolean>>({});

  const { data: results, isLoading } = useTestResults();

  const comparison = useMemo(() => buildRadarComparison(results), [results]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US");

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }
  const hasCDResult = results?.some(
    (r) => !!(r.flags as Record<string, unknown> | undefined)?.templateKey,
  );

  return (
    <>
      <div className="space-y-4 pb-20">
        <h1 className="text-xl font-bold text-foreground font-serif">{t("testResults.title")}</h1>

        <WellnessDisclaimer />

        {results && results.length > 0 && <TestResultsChart results={results} />}

        {results?.length === 0 && (
          <EmptyState
            pet
            petType={pets?.activePetType}
            title={t("testResults.noResults")}
            description={t("testResults.noResultsPet", { name: petName })}
            action={{
              label: t("testResults.takeTest"),
              onClick: () => navigate("/tests"),
            }}
          />
        )}

        {comparison && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BrainCircuit aria-hidden="true" className="w-4 h-4 text-primary" />
                {t("testResults.thinkingPatternsTitle")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {comparison.previous
                  ? t("testResults.thinkingPatternsCompare")
                  : t("testResults.thinkingPatternsSingle")}
              </p>
              {comparison.previous && comparison.previousDate && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-[3px] bg-primary/60" aria-hidden="true" />
                    {t("testResults.thinkingPatternsLast", {
                      date: formatDate(comparison.currentDate),
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-3 h-1.5 border-t-2 border-dashed border-muted-foreground"
                      aria-hidden="true"
                    />
                    {t("testResults.thinkingPatternsPrevious", {
                      date: formatDate(comparison.previousDate),
                    })}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <RadarChart data={comparison.current} previousData={comparison.previous} />
              {comparison.previous && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("testResults.thinkingPatternsBetter")} ·{" "}
                  {t("testResults.thinkingPatternsWorse")} · {t("testResults.thinkingPatternsSame")}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {t("testResults.thinkingPatternsLibraryHint")}
              </p>
            </CardContent>
          </Card>
        )}

        {results?.map((r) => {
          const { isCD, interpretationText, recommendationText, highKeys, moderateKeys } =
            resolve(r);
          const isLongText = isCD || interpretationText.length > 100;

          return (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground">
                  {(r as { testTitle?: string }).testTitle} &middot;{" "}
                  {new Date(r.completedAt).toLocaleDateString(
                    i18n.language === "ru" ? "ru-RU" : "en-US",
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-3 mb-4">
                  <Chip
                    variant={showScore[r.id] ? "active" : "default"}
                    onClick={() => setShowScore((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                  >
                    {showScore[r.id] ? t("testResults.hideScore") : t("testResults.showScore")}
                  </Chip>
                  {showScore[r.id] && (
                    <div className="w-16 h-16 rounded-xl bg-card shadow-neumorphic-sm flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{r.score}</span>
                    </div>
                  )}
                </div>

                {isCD && (highKeys.length > 0 || moderateKeys.length > 0) && (
                  <div className="space-y-2 mb-3">
                    {highKeys.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {t("testResults.high")}
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
                          {t("testResults.moderate")}
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
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0 text-xs"
                    aria-expanded={!!showFull[r.id]}
                    onClick={() => setShowFull((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                  >
                    {showFull[r.id] ? t("testResults.showLess") : t("testResults.showFull")}
                  </Button>
                )}

                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-0 gap-1 mt-3"
                  aria-expanded={!!showRec[r.id]}
                  onClick={() => setShowRec((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={`w-4 h-4 ${showRec[r.id] ? "rotate-90" : ""}`}
                  />
                  {t("testDetail.recommendation")}
                </Button>

                {showRec[r.id] && (
                  <p className="text-sm mt-2 text-muted-foreground">{recommendationText}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <StickyBottomBar>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/practices/breathing">{t("testResults.nextBreathing")}</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/dashboard">{t("testResults.nextTrack")}</Link>
          </Button>
          {hasCDResult && (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/practices/distortions">{t("testResults.nextDistortions")}</Link>
            </Button>
          )}
          <Button variant="secondary" size="sm" asChild>
            <Link to="/tests">{t("testResults.nextTests")}</Link>
          </Button>
        </div>
      </StickyBottomBar>
    </>
  );
}
