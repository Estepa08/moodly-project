import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreatureState, useCompleteExercise } from "../hooks/useCreature";
import AnxietyCreature from "../components/AnxietyCreature";
import BreathingGuide from "../components/BreathingGuide";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type Phase = "idle" | "exercising" | "done";

export default function BreathingPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastDuration, setLastDuration] = useState(0);

  const { data: creature } = useCreatureState();
  const completeExercise = useCompleteExercise();

  const calmness = creature?.calmness ?? 50;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">{t("breathing.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("breathing.subtitle")}</p>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <AnxietyCreature calmness={calmness} size={200} />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-card rounded-full px-3 py-1 shadow-neumorphic-sm text-xs font-medium text-primary">
            {t("breathing.calmness")}: {calmness}%
          </div>
        </div>
      </div>

      {phase === "idle" && (
        <Card className="shadow-neumorphic">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-muted-foreground mb-4">
              {t("breathing.description")}
            </p>
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
          <CardContent className="pt-6">
            <BreathingGuide
              autoStart
              onComplete={(duration) => {
                setLastDuration(duration);
                completeExercise.mutate(duration);
                setPhase("done");
              }}
              onCancel={() => setPhase("idle")}
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
            <p className="text-sm text-muted-foreground">
              {t("breathing.calmnessNow")}: <span className="font-semibold text-accent">{creature?.calmness ?? calmness}%</span>
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
            <li>{t("breathing.step1")}</li>
            <li>{t("breathing.step2")}</li>
            <li>{t("breathing.step3")}</li>
            <li>{t("breathing.step4")}</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
