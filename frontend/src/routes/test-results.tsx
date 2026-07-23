import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { useTests, useTestResults } from "../hooks/useTests";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Spinner from "../components/ui/spinner";
import { useTestTranslation } from "../hooks/useTestTranslation";
import { useTestResultText, getCrisisSeverity } from "../hooks/useTestResultText";
import MedicalDisclaimer from "../components/MedicalDisclaimer";
import CrisisDialog from "../components/CrisisDialog";
import { cn } from "../lib/utils";
import StickyBottomBar from "../components/ui/sticky-bottom-bar";

export default function TestResultsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { tTestTitle } = useTestTranslation();
  const { resolve } = useTestResultText();
  const [showFull, setShowFull] = useState<Record<string, boolean>>({});
  const [showScore, setShowScore] = useState<Record<string, boolean>>({});
  const [showRec, setShowRec] = useState<Record<string, boolean>>({});
  const [crisisResultId, setCrisisResultId] = useState<string | null>(null);

  const { data: tests } = useTests();
  const { data: results, isLoading } = useTestResults();

  const crisisOpen = crisisResultId !== null;
  const crisisResult = crisisOpen ? results?.find((r) => r.id === crisisResultId) : undefined;
  const crisisSeverity = crisisResult ? getCrisisSeverity(crisisResult.recommendation) : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  const testMap = new Map(tests?.map((t) => [t.id, t.title]));
  const hasCDResult = results?.some((r) => !!(r.flags as Record<string, unknown> | undefined)?.templateKey);

  useEffect(() => {
    if (!results) return;
    for (const r of results) {
      if (getCrisisSeverity(r.recommendation) && !showRec[r.id]) {
        setShowRec((prev) => ({ ...prev, [r.id]: true }));
      }
    }
  }, [results, showRec]);

  return (
    <>
      <CrisisDialog
        open={crisisOpen}
        severity={crisisSeverity || "urgent"}
        onDismiss={() => setCrisisResultId(null)}
      />

      <div className="space-y-4 pb-20">
        <h1 className="text-xl font-bold text-foreground font-serif">{t("testResults.title")}</h1>

        <MedicalDisclaimer />

        {results?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">{t("testResults.noResults")}</p>
        )}

        {results?.map((r) => {
          const { isCD, interpretationText, recommendationText, crisisSeverity: crisisType, isSevere: severeUnlessCrisis, highKeys, moderateKeys } = resolve(r);
          const isSevere = !crisisType && severeUnlessCrisis;
          const isLongText = isCD || interpretationText.length > 100;

          return (
            <Card
              key={r.id}
              className={cn(
                crisisType && "border-destructive/30",
                isSevere && !crisisType && "border-orange-300",
              )}
            >
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground">
                  {tTestTitle(testMap.get(r.testId) || "")} &middot;{" "}
                  {new Date(r.completedAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-3 mb-4">
                  <button
                    onClick={() => setShowScore((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card shadow-neumorphic-sm text-xs font-medium cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      showScore[r.id] ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {showScore[r.id] ? t("testResults.hideScore") : t("testResults.showScore")}
                  </button>
                  {showScore[r.id] && (
                    <div
                      className={cn(
                        "w-16 h-16 rounded-xl bg-card shadow-neumorphic-sm flex items-center justify-center",
                        crisisType && "border-2 border-destructive",
                        isSevere && !crisisType && "border-2 border-orange-300",
                      )}
                    >
                      <span
                        className={cn(
                          "text-2xl font-bold",
                          crisisType ? "text-destructive" : "text-primary",
                        )}
                      >
                        {r.score}
                      </span>
                    </div>
                  )}
                </div>

                {crisisType && (
                  <button
                    className="w-full flex items-center justify-center gap-1.5 mb-3 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-medium cursor-pointer transition-all duration-150 active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setCrisisResultId(r.id)}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {crisisType === "critical"
                      ? t("crisis.titleCritical")
                      : t("crisis.titleUrgent")}
                  </button>
                )}

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
                  <button
                    aria-expanded={!!showFull[r.id]}
                    className="text-xs text-primary hover:underline mt-1 cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      setShowFull((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                    }
                  >
                    {showFull[r.id] ? t("testResults.showLess") : t("testResults.showFull")}
                  </button>
                )}

                <button
                  aria-expanded={!!showRec[r.id]}
                  className="flex items-center gap-1 text-sm text-primary hover:underline mt-3 cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setShowRec((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                >
                  <ChevronRight className={`w-4 h-4 ${showRec[r.id] ? "rotate-90" : ""}`} />
                  {t("testDetail.recommendation")}
                </button>

                {showRec[r.id] && (
                  <p className={cn("text-sm mt-2", crisisType ? "text-destructive font-medium" : "text-muted-foreground")}>
                    {recommendationText}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <StickyBottomBar>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary" size="sm" onClick={() => navigate("/breathing")}>
            {t("testResults.nextBreathing")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
            {t("testResults.nextTrack")}
          </Button>
          {hasCDResult && (
            <Button variant="secondary" size="sm" onClick={() => navigate("/distortions")}>
              {t("testResults.nextDistortions")}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate("/tests")}>
            {t("testResults.nextTests")}
          </Button>
        </div>
      </StickyBottomBar>
    </>
  );
}
