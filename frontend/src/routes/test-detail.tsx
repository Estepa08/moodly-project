import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Spinner from "../components/ui/spinner";
import { useTestTranslation } from "../hooks/useTestTranslation";
import { useTestFlow } from "../hooks/useTestFlow";
import { useTestResultText } from "../hooks/useTestResultText";
import RadarChart from "../components/RadarChart";
import type { DistortionEntry } from "../components/RadarChart";
import MedicalDisclaimer from "../components/MedicalDisclaimer";
import ContentWarningDialog from "../components/ContentWarningDialog";
import CrisisDialog from "../components/CrisisDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { ChevronLeft, Check } from "lucide-react";
import StickyBottomBar from "../components/ui/sticky-bottom-bar";

export default function TestDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { tQuestion, tOption, tTestTitle } = useTestTranslation();
  const { resolve } = useTestResultText();

  const {
    test,
    isLoading,
    submitMutation,
    questionIndex,
    currentAnswer,
    answers,
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
  } = useTestFlow(testId);

  // ── Result view ──
  if (result && test) {
    const maxScore = test.questions.length * 3;
    const { interpretationText, recommendationText, crisisSeverity } = resolve(result);
    const cdDistortions = result.flags?.distortions;
    const cdKeys = cdDistortions ? Object.keys(cdDistortions) : [];

    return (
      <>
        <CrisisDialog
          open={crisisDialogOpen}
          severity={crisisSeverity || "urgent"}
          onDismiss={() => setCrisisDialogOpen(false)}
        />
        <div className="max-w-lg mx-auto pb-20">
          <Card>
            <CardHeader>
              <CardTitle>
                {tTestTitle(test.title)} — {t("testDetail.result")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScoreBlock score={result.score} maxScore={maxScore} />
              <div>
                <p className="font-medium">{t("testDetail.interpretation")}</p>
                <p className="text-muted-foreground">{interpretationText}</p>
              </div>
              {cdDistortions && cdKeys.length > 0 && (
                <div>
                  <p className="font-medium mb-2">{t("cognitiveDistortions.yourProfile")}</p>
                  <RadarChart
                    data={
                      cdKeys.map((key) => ({
                        key,
                        score: cdDistortions[key].score,
                      })) as DistortionEntry[]
                    }
                  />
                </div>
              )}
              <div>
                <p className="font-medium">{t("testDetail.recommendation")}</p>
                <p className="text-muted-foreground">{recommendationText}</p>
              </div>
              <Button className="w-full" onClick={() => navigate("/results")}>
                {t("testDetail.viewAll")}
              </Button>
            </CardContent>
          </Card>
          <div className="mt-4">
            <MedicalDisclaimer />
          </div>
        </div>
        <StickyBottomBar>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="secondary" size="sm" onClick={() => navigate("/breathing")}>
              {t("testResults.nextBreathing")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
              {t("testResults.nextTrack")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/tests")}>
              {t("testResults.nextTests")}
            </Button>
          </div>
        </StickyBottomBar>
      </>
    );
  }

  // ── Loading ──
  if (isLoading || !test) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  // ── Review screen ──
  if (showReview) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-lg font-semibold font-serif text-foreground">
          {t("testDetail.reviewTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("testDetail.reviewDesc")}</p>

        <div className="space-y-2">
          {test.questions.map((q, i) => {
            const ans = answers[i];
            const opt = ans ? q.options.find((o) => o.id === ans.optionId) : null;
            return (
              <button
                key={q.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card shadow-neumorphic-sm text-left cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => handleGoToQuestion(i)}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{tQuestion(q.id, q.text)}</p>
                  {opt && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {tOption(opt.id, opt.text)}
                    </p>
                  )}
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0 rotate-180" />
              </button>
            );
          })}
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={submitMutation.isPending}>
          {submitMutation.isPending ? t("common.sending") : t("testDetail.submitTest")}
        </Button>
      </div>
    );
  }

  // ── Question view ──
  const question = test.questions[questionIndex];
  const isFirst = questionIndex === 0;
  const hasAnswer = answers.length > questionIndex;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <ContentWarningDialog
        open={showContentWarning}
        onContinue={handleContinueFromWarning}
        onSkip={handleSkipFromWarning}
      />

      <ExitConfirmDialog
        open={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => navigate("/tests")}
      />

      <header className="flex items-center justify-between">
        <div className="w-20" />
        <h1 className="text-lg font-semibold text-foreground font-serif">
          {tTestTitle(test.title)}
        </h1>
        <Button variant="ghost" size="sm" onClick={() => setShowExitConfirm(true)}>
          {t("testDetail.exit")}
        </Button>
      </header>

      <div className="flex gap-1">
        {test.questions.map((_, i) => {
          const isDone = answers.length > i;
          const isCurrent = i === questionIndex;
          return (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                isDone && "bg-primary",
                isCurrent && !isDone && "bg-primary/50",
                !isDone && !isCurrent && "bg-muted",
              )}
            />
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {tQuestion(question.id, question.text)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {question.options.map((option) => {
            const isSelected = currentAnswer?.optionId === option.id;
            return (
              <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "w-full justify-start h-auto py-3 px-4 relative transition-all duration-150",
                  isSelected && "shadow-neumorphic-inset",
                )}
                onClick={() => {
                  if (currentAnswer?.optionId === option.id && hasAnswer) return;
                  handleAnswer(option.id);
                }}
                disabled={submitMutation.isPending}
              >
                {tOption(option.id, option.text)}
                {isSelected && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {!isFirst ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("testDetail.previous")}
          </Button>
        ) : (
          <div />
        )}

        <p className="text-xs text-muted-foreground">
          {t("testDetail.questionProgress", {
            current: questionIndex + 1,
            total: test.questions.length,
          })}
        </p>

        {hasAnswer && questionIndex === test.questions.length - 1 ? (
          <Button size="sm" onClick={() => setShowReview(true)}>
            {t("testDetail.review")}
          </Button>
        ) : hasAnswer ? (
          <Button size="sm" onClick={handleNext}>
            {t("testDetail.next")}
          </Button>
        ) : (
          <div className="w-20" />
        )}
      </div>
    </div>
  );
}

function ScoreBlock({ score, maxScore }: { score: number; maxScore: number }) {
  const { t } = useTranslation();
  const [showScore, setShowScore] = useState(false);
  return (
    <div className="text-center">
      <button
        onClick={() => setShowScore(!showScore)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card shadow-neumorphic-sm text-xs font-medium text-muted-foreground cursor-pointer hover:text-primary transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {showScore ? t("testResults.hideScore") : t("testResults.showScore")}
      </button>
      {showScore && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-1">
          <div className="text-3xl font-bold text-primary">
            {t("testResults.scoreOf", { score, max: maxScore })}
          </div>
          <p className="text-sm text-muted-foreground">{t("testDetail.score")}</p>
        </div>
      )}
    </div>
  );
}

function ExitConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("testDetail.exitConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("testDetail.exitConfirmDesc")}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {t("testDetail.exitConfirmCancel")}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            {t("testDetail.exitConfirmExit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
