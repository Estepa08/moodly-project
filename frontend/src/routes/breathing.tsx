import { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useCompleteExercise } from "../features/gamification";
import { celebrate } from "../features/gamification";
import { BreathingGuide, BreathPhase, BreathingTechnique } from "../features/breathing";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Spinner from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import { SegmentGroup, SegmentButton } from "../components/ui/segment-button";

const BreathingCreature = lazy(() => import("../features/breathing/BreathingCreature"));

type Phase = "idle" | "countdown" | "exercising" | "done";

const STEPS_478 = ["step1", "step2", "step3", "step4"] as const;
const STEPS_BOX = ["step1", "stepBox1", "stepBox2", "stepBox3", "stepBox4"] as const;
const STEPS_QUICK = ["step1", "stepQuick1", "stepQuick2"] as const;

export default function BreathingPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [technique, setTechnique] = useState<BreathingTechnique>(BreathingTechnique.Box);
  const [lastDuration, setLastDuration] = useState(0);
  const [breathPhase, setBreathPhase] = useState<BreathPhase>(BreathPhase.Inhale);
  const [breathProgress, setBreathProgress] = useState(0);

  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setCountdown(3);
      setPhase("exercising");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const completeExercise = useCompleteExercise();

  const steps =
    technique === BreathingTechnique.FourSevenEight
      ? STEPS_478
      : technique === BreathingTechnique.Quick
        ? STEPS_QUICK
        : STEPS_BOX;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {phase === "idle" && (
        <Card className="shadow-neumorphic">
          <CardHeader className="flex-row items-center gap-3 sm:gap-4">
            <Suspense fallback={<Spinner size={120} />}>
              <BreathingCreature
                calmness={50}
                size={120}
                breathingPhase={breathPhase}
                breathingProgress={breathProgress}
                followCursor
              />
            </Suspense>
            <div>
              <CardTitle className="text-xl font-serif">{t("breathing.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("breathing.subtitle")}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              {t(
                `breathing.description${technique === BreathingTechnique.Box ? "Box" : technique === BreathingTechnique.Quick ? "Quick" : "478"}`,
              )}
            </p>
            <div className="flex justify-center">
              <SegmentGroup>
                <SegmentButton
                  active={technique === BreathingTechnique.Box}
                  onClick={() => setTechnique(BreathingTechnique.Box)}
                >
                  {t("breathing.techniqueBox")}
                </SegmentButton>
                <SegmentButton
                  active={technique === BreathingTechnique.FourSevenEight}
                  onClick={() => setTechnique(BreathingTechnique.FourSevenEight)}
                >
                  {t("breathing.technique478")}
                </SegmentButton>
                <SegmentButton
                  active={technique === BreathingTechnique.Quick}
                  onClick={() => setTechnique(BreathingTechnique.Quick)}
                >
                  {t("breathing.techniqueQuick")}
                </SegmentButton>
              </SegmentGroup>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground border-t border-border pt-4">
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
                {t("breathing.howItWorks")}
              </p>
              <ol className="list-decimal list-inside space-y-0.5">
                {steps.map((step) => (
                  <li key={step}>{t(`breathing.${step}`)}</li>
                ))}
              </ol>
            </div>
            <div className="flex justify-center">
              <Button size="lg" onClick={() => setPhase("countdown")}>
                {t("breathing.begin")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "countdown" && (
        <Card className="shadow-neumorphic">
          <CardHeader className="flex-row items-center gap-3 sm:gap-4">
            <Suspense fallback={<Spinner size={120} />}>
              <BreathingCreature
                calmness={50}
                size={120}
                breathingPhase={breathPhase}
                breathingProgress={breathProgress}
                followCursor
              />
            </Suspense>
            <div>
              <CardTitle className="text-xl font-serif">{t("breathing.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("breathing.subtitle")}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {t("breathing.prepare")}
            </p>
            <div className="text-7xl font-bold text-primary font-serif animate-in zoom-in">
              {countdown}
            </div>
            <p className="text-sm text-muted-foreground">
              {t(
                `breathing.pattern${technique === BreathingTechnique.Box ? "Box" : technique === BreathingTechnique.Quick ? "Quick" : "478"}`,
              )}
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0 text-xs text-muted-foreground"
              onClick={() => {
                setCountdown(3);
                setPhase("idle");
              }}
            >
              {t("breathing.cancel")}
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "exercising" && (
        <Card className="shadow-neumorphic">
          <CardHeader className="flex-row items-center gap-3 sm:gap-4">
            <Suspense fallback={<Spinner size={120} />}>
              <BreathingCreature
                calmness={50}
                size={120}
                breathingPhase={breathPhase}
                breathingProgress={breathProgress}
                followCursor={false}
              />
            </Suspense>
            <div>
              <CardTitle className="text-xl font-serif">{t("breathing.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("breathing.subtitle")}</p>
            </div>
          </CardHeader>
          <CardContent>
            <BreathingGuide
              autoStart
              technique={technique}
              onBreathChange={(phase, progress) => {
                setBreathPhase(phase);
                setBreathProgress(progress);
              }}
              onComplete={(duration) => {
                setLastDuration(duration);
                setBreathPhase(BreathPhase.Inhale);
                setBreathProgress(0);
                completeExercise.mutate(duration, {
                  onSuccess: (data) => {
                    if (data.leveledUp) {
                      celebrate(
                        t("dailyCheckIn.levelUpTitle"),
                        t("dailyCheckIn.levelUpBody", { level: data.state.level }),
                      );
                    }
                  },
                });
                setPhase("done");
              }}
              onCancel={() => {
                setBreathPhase(BreathPhase.Inhale);
                setBreathProgress(0);
                setPhase("idle");
              }}
            />
          </CardContent>
        </Card>
      )}

      {phase === "done" && (
        <Card className="shadow-neumorphic">
          <CardHeader className="flex-row items-center gap-3 sm:gap-4">
            <Suspense fallback={<Spinner size={120} />}>
              <BreathingCreature
                calmness={50}
                size={120}
                breathingPhase={breathPhase}
                breathingProgress={breathProgress}
                followCursor
              />
            </Suspense>
            <div>
              <CardTitle className="text-xl font-serif">{t("breathing.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("breathing.subtitle")}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("breathing.sessionComplete", { duration: lastDuration })}
            </p>
            <p className="text-sm text-foreground/80">{t("breathing.calmnessNow")}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setPhase("countdown")}>{t("breathing.doAnother")}</Button>
              <Button variant="outline" onClick={() => setPhase("idle")}>
                {t("common.back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
