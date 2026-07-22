import { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useCreatureState, useCompleteExercise } from "../hooks/useCreature";
import BreathingGuide from "../components/BreathingGuide";
import type { BreathingTechnique } from "../components/BreathingGuide";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Spinner from "../components/ui/spinner";

const BreathingCreature = lazy(() => import("../components/BreathingCreature"));

type Phase = "idle" | "exercising" | "done";

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

  const { data: creature } = useCreatureState();
  const completeExercise = useCompleteExercise();

  const steps = technique === "478" ? STEPS_478 : technique === "quick" ? STEPS_QUICK : STEPS_BOX;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">{t("breathing.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("breathing.subtitle")}</p>
      </div>

      <div className="flex justify-center">
        <div className="relative w-72 h-72 flex items-center justify-center">
          <Suspense fallback={<Spinner size={40} className="mx-auto" />}>
            <BreathingCreature
              calmness={50}
              size={200}
              breathingPhase={breathPhase}
              breathingProgress={breathProgress}
              followCursor={phase !== "exercising"}
            />
          </Suspense>
        </div>
      </div>

      {phase === "idle" && (
        <Card className="shadow-neumorphic">
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              {t("breathing.description")}
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
            <div className="flex justify-center">
              <button
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl shadow-neumorphic font-medium cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setPhase("exercising")}
              >
                {t("breathing.begin")}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "exercising" && (
        <Card className="shadow-neumorphic">
          <CardContent className="p-4">
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
          <CardHeader className="flex-row items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <div className="w-4 h-4 rounded-full bg-accent" />
            </div>
            <CardTitle className="text-base text-accent">{t("breathing.done")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("breathing.sessionComplete", { duration: lastDuration })}
            </p>
            <p className="text-sm text-foreground/80">
              {t("breathing.calmnessNow")}
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl shadow-neumorphic-sm font-medium cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setPhase("exercising")}
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

      <Card className="shadow-neumorphic-sm">
        <CardHeader>
          <CardTitle className="text-sm">{t("breathing.howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            {steps.map((step) => (
              <li key={step}>{t(`breathing.${step}`)}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
