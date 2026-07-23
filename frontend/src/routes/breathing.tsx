import { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useCreatureState, useCompleteExercise } from "../hooks/useCreature";
import BreathingGuide from "../components/BreathingGuide";
import type { BreathingTechnique } from "../components/BreathingGuide";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Spinner from "../components/ui/spinner";

const BreathingCreature = lazy(() => import("../components/BreathingCreature"));

type Phase = "idle" | "countdown" | "exercising" | "done";

const STEPS_478 = ["step1", "step2", "step3", "step4"] as const;
const STEPS_BOX = ["step1", "stepBox1", "stepBox2", "stepBox3", "stepBox4"] as const;
const STEPS_QUICK = ["step1", "stepQuick1", "stepQuick2"] as const;

export default function BreathingPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [technique, setTechnique] = useState<BreathingTechnique>("box");
  const [lastDuration, setLastDuration] = useState(0);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
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

  const { data: creature } = useCreatureState();
  const completeExercise = useCompleteExercise();

  const steps = technique === "478" ? STEPS_478 : technique === "quick" ? STEPS_QUICK : STEPS_BOX;

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
                `breathing.description${technique === "box" ? "Box" : technique === "quick" ? "Quick" : "478"}`,
              )}
            </p>
            <div className="flex justify-center">
              <div className="flex rounded-xl bg-muted p-1 shadow-neumorphic-inset">
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    technique === "box"
                      ? "bg-card text-foreground shadow-neumorphic-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setTechnique("box")}
                >
                  {t("breathing.techniqueBox")}
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    technique === "478"
                      ? "bg-card text-foreground shadow-neumorphic-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setTechnique("478")}
                >
                  {t("breathing.technique478")}
                </button>
                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    technique === "quick"
                      ? "bg-card text-foreground shadow-neumorphic-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setTechnique("quick")}
                >
                  {t("breathing.techniqueQuick")}
                </button>
              </div>
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
              <button
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl shadow-neumorphic font-medium cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setPhase("countdown")}
              >
                {t("breathing.begin")}
              </button>
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
                `breathing.pattern${technique === "box" ? "Box" : technique === "quick" ? "Quick" : "478"}`,
              )}
            </p>
            <button
              className="text-xs text-muted-foreground underline cursor-pointer hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setCountdown(3);
                setPhase("idle");
              }}
            >
              {t("breathing.cancel")}
            </button>
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
                setBreathPhase("inhale");
                setBreathProgress(0);
                completeExercise.mutate(duration);
                setPhase("done");
              }}
              onCancel={() => {
                setBreathPhase("inhale");
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
              <button
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl shadow-neumorphic-sm font-medium cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setPhase("countdown")}
              >
                {t("breathing.doAnother")}
              </button>
              <button
                className="px-6 py-2 bg-card text-primary rounded-xl shadow-neumorphic-sm font-medium cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setPhase("idle")}
              >
                {t("common.back")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
