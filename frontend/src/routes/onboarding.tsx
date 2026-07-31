import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Wind,
  LayoutDashboard,
  ClipboardList,
  Brain,
  Moon,
  Heart,
  Sparkles,
  Bell,
} from "lucide-react";
import { useOnboarding } from "../hooks/useOnboarding";
import { ExpLevel } from "../lib/constants";
import Spinner from "../components/ui/spinner";
import { useSetPet } from "../features/gamification";
import { PET_DEFINITIONS, STARTER_PET_TYPES } from "../features/gamification/pets";
import { cn } from "../lib/utils";

const GOALS = [
  { key: "stress", icon: Wind },
  { key: "anxiety", icon: Brain },
  { key: "sleep", icon: Moon },
  { key: "mood", icon: Heart },
  { key: "therapy", icon: ClipboardList },
] as const;

const EXP_LEVELS = [ExpLevel.Beginner, ExpLevel.Intermediate, ExpLevel.Advanced];

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { needsOnboarding, isLoading, complete } = useOnboarding();
  const setPet = useSetPet();

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [expLevel, setExpLevel] = useState<ExpLevel>(ExpLevel.Beginner);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [petType, setPetType] = useState<string>("puff");
  const [petName, setPetName] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!needsOnboarding) {
    navigate("/", { replace: true });
    return null;
  }

  const toggleGoal = (key: string) => {
    setGoals((prev) => (prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]));
  };

  const handleFinish = async (destination = "/") => {
    setSaving(true);
    try {
      await complete({ goals, experienceLevel: expLevel, dailyReminder, reminderTime });
      if (petName.trim() || petType !== "puff") {
        await setPet.mutateAsync({ petType, petName: petName.trim() || null });
      }
      navigate(destination, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    await complete({ goals: [], experienceLevel: ExpLevel.Beginner, dailyReminder: false });
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                  i === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t("onboarding2.welcomeTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("onboarding2.welcomeDesc")}</p>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={handleSkip} disabled={saving}>
                  {t("onboarding.skip")}
                </Button>
                <Button onClick={() => setStep(1)}>{t("onboarding.next")}</Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t("onboarding2.goalsTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("onboarding2.goalsDesc")}</p>
              <div className="flex flex-col gap-2">
                {GOALS.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleGoal(key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 text-left cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      goals.includes(key)
                        ? "border-primary bg-primary/5 shadow-neumorphic-sm"
                        : "border-border bg-card shadow-neumorphic-sm"
                    }`}
                  >
                    <Icon aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {t(`onboarding2.goal${key.charAt(0).toUpperCase() + key.slice(1)}`)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip} disabled={saving}>
                  {t("onboarding.skip")}
                </Button>
                <Button onClick={() => setStep(2)}>{t("onboarding.next")}</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t("onboarding2.expTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("onboarding2.expDesc")}</p>
              <div className="flex flex-col gap-2">
                {EXP_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setExpLevel(level)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 text-left cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      expLevel === level
                        ? "border-primary bg-primary/5 shadow-neumorphic-sm"
                        : "border-border bg-card shadow-neumorphic-sm"
                    }`}
                  >
                    <Sparkles
                      aria-hidden="true"
                      className={`w-5 h-5 shrink-0 ${
                        expLevel === level ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t(`onboarding2.exp${level.charAt(0).toUpperCase() + level.slice(1)}`)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  {t("common.back")}
                </Button>
                <Button onClick={() => setStep(3)}>{t("onboarding.next")}</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t("onboarding2.reminderTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("onboarding2.reminderDesc")}</p>
              <div className="flex items-center justify-center gap-4 py-2">
                <Bell aria-hidden="true" className="w-6 h-6 text-primary" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyReminder}
                    onChange={(e) => setDailyReminder(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-card after:rounded-full after:h-5 after:w-5 after:shadow-neumorphic-sm after:transition-[transform] peer-checked:after:translate-x-full" />
                </label>
              </div>
              {dailyReminder && (
                <div className="flex justify-center">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-card shadow-neumorphic-inset text-sm text-foreground border-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  {t("common.back")}
                </Button>
                <Button onClick={() => setStep(4)}>{t("onboarding.next")}</Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t("onboarding2.petTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("onboarding2.petDesc")}</p>

              <div className="flex justify-center py-2">
                <div className="relative w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                  <span aria-hidden="true" className="text-5xl">
                    {PET_DEFINITIONS.find((p) => p.type === petType)?.emoji ?? "🫧"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse"
                  />
                </div>
              </div>

              <div className="text-left">
                <label
                  htmlFor="pet-name"
                  className="block text-xs font-medium text-muted-foreground mb-1.5"
                >
                  {t("onboarding2.petNameLabel")}
                </label>
                <input
                  id="pet-name"
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder={t("onboarding2.petNamePlaceholder")}
                  maxLength={24}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm placeholder:text-muted-foreground/70 border-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="text-left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("onboarding2.petChooseTitle")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PET_DEFINITIONS.filter((p) =>
                    STARTER_PET_TYPES.includes(p.type as never),
                  ).map((pet) => {
                    const isActive = petType === pet.type;
                    return (
                      <button
                        key={pet.type}
                        type="button"
                        onClick={() => setPetType(pet.type)}
                        aria-pressed={isActive}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-[background-color,border-color,box-shadow,transform] duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "border-primary bg-primary/5 shadow-neumorphic-sm"
                            : "border-border bg-card shadow-neumorphic-sm",
                        )}
                      >
                        <span
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                            pet.color,
                          )}
                        >
                          <span aria-hidden="true">{pet.emoji}</span>
                        </span>
                        <span className="text-[11px] font-medium text-foreground leading-tight">
                          {t(pet.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">{t("onboarding2.petMoreHint")}</p>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  {t("common.back")}
                </Button>
                <Button onClick={() => setStep(5)}>{t("onboarding.next")}</Button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">
                {t("onboarding2.actionTitle")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("onboarding2.actionDesc")}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleFinish("/")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-[opacity,transform] active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LayoutDashboard aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("onboarding.chooseDashboard")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("onboarding.chooseDashboardDesc")}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleFinish("/practices/breathing")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-[opacity,transform] active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Wind aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("onboarding.chooseBreathing")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("breathing.subtitle")}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleFinish("/tests")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-[opacity,transform] active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ClipboardList aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("onboarding.chooseTest")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("tests.title")}</p>
                  </div>
                </button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(4)}>
                  {t("common.back")}
                </Button>
                <Button onClick={() => handleFinish("/")} disabled={saving}>
                  {saving ? t("common.saving") : t("onboarding.getStarted")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
