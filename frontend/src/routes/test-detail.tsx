import { useTranslation } from "react-i18next";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Chip } from "../components/ui/chip";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Spinner from "../components/ui/spinner";
import { useTestFlow } from "../hooks/useTestFlow";
import { useTestResultText } from "../hooks/useTestResultText";
import { RadarChart } from "../features/analytics";
import type { DistortionEntry } from "../features/analytics";
import { WellnessDisclaimer } from "../widgets";
import { RewardMoment, PetAvatar, usePets, useFeed } from "../features/gamification";
import { PET_DEFINITIONS } from "../features/gamification/pets";
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
  const { resolve } = useTestResultText();
  const { data: pets } = usePets();
  const feed = useFeed();
  const [feedSignal, setFeedSignal] = useState(0);

  const {
    test,
    isLoading,
    submitMutation,
    questionIndex,
    currentAnswer,
    answers,
    result,
    showExitConfirm,
    setShowExitConfirm,
    handleAnswer,
    handleNext,
    handleBack,
    handleSubmit,
  } = useTestFlow(testId);

  const petType = pets?.activePetType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === petType)?.labelKey ?? "pets.puff");

  const handleNextFeed = () => {
    const isLastQuestion = test ? questionIndex === test.questions.length - 1 : false;
    handleNext();
    if (!isLastQuestion) {
      feed.mutate();
      setFeedSignal(Date.now());
    }
  };

  // ── Result view ──
  if (result && test) {
    const maxScore = test.questions.length * 3;
    const { interpretationText, recommendationText } = resolve(result);
    const cdDistortions = result.flags?.distortions;
    const cdKeys = cdDistortions ? Object.keys(cdDistortions) : [];

    return (
      <>
        <div className="max-w-lg mx-auto pb-20">
          <RewardMoment
            title={t("reward.testComplete")}
            chip={t("reward.missionTest")}
            showCollectionLink
            className="mb-4"
          />
          <Card>
            <CardHeader>
              <CardTitle>
                {test.title} — {t("testDetail.result")}
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
              <Button className="w-full" asChild>
                <Link to="/">{t("testDetail.viewAll")}</Link>
              </Button>
            </CardContent>
          </Card>
          <div className="mt-4">
            <WellnessDisclaimer />
          </div>
        </div>
        <StickyBottomBar>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/practices/breathing">{t("testResults.nextBreathing")}</Link>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link to="/dashboard">{t("testResults.nextTrack")}</Link>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link to="/tests">{t("testResults.nextTests")}</Link>
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

  if (!test.active) {
    return (
      <div className="max-w-lg mx-auto space-y-4 py-16 text-center">
        <h1 className="text-lg font-semibold font-serif text-foreground">
          {t("testDetail.unavailable")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("testDetail.unavailableDesc")}</p>
        <Button className="mt-4" asChild>
          <Link to="/tests">{t("common.back")}</Link>
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
      <ExitConfirmDialog
        open={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => navigate("/tests")}
      />

      <header className="flex items-center justify-between">
        <div className="w-20" />
        <h1 className="text-lg font-semibold text-foreground font-serif">{test.title}</h1>
        <Button variant="ghost" size="sm" onClick={() => setShowExitConfirm(true)}>
          {t("testDetail.exit")}
        </Button>
      </header>

      <div className="flex items-center gap-3">
        <div
          className="flex flex-1 gap-1"
          role="progressbar"
          aria-valuenow={questionIndex + 1}
          aria-valuemin={1}
          aria-valuemax={test.questions.length}
          aria-label={t("testDetail.questionProgress", {
            current: questionIndex + 1,
            total: test.questions.length,
          })}
        >
          {test.questions.map((_, i) => {
            const isDone = answers.length > i;
            const isCurrent = i === questionIndex;
            return (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-200",
                  isDone && "bg-primary",
                  isCurrent && !isDone && "bg-primary/70",
                  !isDone && !isCurrent && "bg-primary/30",
                )}
              />
            );
          })}
        </div>
        <PetAvatar petType={petType} size="sm" plain ariaLabel={petName} feedSignal={feedSignal} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {question.options.map((option) => {
            const isSelected = currentAnswer?.optionId === option.id;
            return (
              <Button
                key={option.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "w-full justify-start h-auto py-3 px-4 relative transition-[box-shadow] duration-150",
                  isSelected && "shadow-neumorphic-inset",
                )}
                onClick={() => {
                  if (currentAnswer?.optionId === option.id && hasAnswer) return;
                  handleAnswer(option.id);
                }}
                disabled={submitMutation.isPending}
              >
                {option.text}
                {isSelected && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in">
                    <Check aria-hidden="true" className="w-4 h-4" />
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
            <ChevronLeft aria-hidden="true" className="w-4 h-4" />
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
          <Button size="sm" onClick={handleSubmit} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? t("common.sending") : t("testDetail.submitTest")}
          </Button>
        ) : hasAnswer ? (
          <Button size="sm" onClick={handleNextFeed}>
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
      <Chip
        variant="default"
        onClick={() => setShowScore(!showScore)}
        className="text-muted-foreground hover:text-primary"
      >
        {showScore ? t("testResults.hideScore") : t("testResults.showScore")}
      </Chip>
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
