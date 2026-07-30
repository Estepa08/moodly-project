import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { ChevronRight, ClipboardList } from "lucide-react";
import { useTestResults } from "../hooks/useTests";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Spinner from "../components/ui/spinner";
import EmptyState from "../components/ui/empty-state";
import { TestResultsChart } from "../features/analytics";
import { useTestResultText } from "../hooks/useTestResultText";
import { WellnessDisclaimer } from "../widgets";
import { cn } from "../lib/utils";
import StickyBottomBar from "../components/ui/sticky-bottom-bar";

export default function TestResultsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { resolve } = useTestResultText();
  const [showFull, setShowFull] = useState<Record<string, boolean>>({});
  const [showScore, setShowScore] = useState<Record<string, boolean>>({});
  const [showRec, setShowRec] = useState<Record<string, boolean>>({});

  const { data: results, isLoading } = useTestResults();

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
            icon={ClipboardList}
            title={t("testResults.noResults")}
            action={{
              label: t("testResults.takeTest"),
              onClick: () => navigate("/tests"),
            }}
          />
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
                  <button
                    onClick={() => setShowScore((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card shadow-neumorphic-sm text-xs font-medium cursor-pointer transition-[color,background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      showScore[r.id] ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {showScore[r.id] ? t("testResults.hideScore") : t("testResults.showScore")}
                  </button>
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
                  <button
                    aria-expanded={!!showFull[r.id]}
                    className="text-xs text-primary hover:underline mt-1 cursor-pointer transition-[text-decoration,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setShowFull((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                  >
                    {showFull[r.id] ? t("testResults.showLess") : t("testResults.showFull")}
                  </button>
                )}

                <button
                  aria-expanded={!!showRec[r.id]}
                  className="flex items-center gap-1 text-sm text-primary hover:underline mt-3 cursor-pointer transition-[text-decoration,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setShowRec((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={`w-4 h-4 ${showRec[r.id] ? "rotate-90" : ""}`}
                  />
                  {t("testDetail.recommendation")}
                </button>

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
            <Link to="/breathing">{t("testResults.nextBreathing")}</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/dashboard">{t("testResults.nextTrack")}</Link>
          </Button>
          {hasCDResult && (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/distortions">{t("testResults.nextDistortions")}</Link>
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
