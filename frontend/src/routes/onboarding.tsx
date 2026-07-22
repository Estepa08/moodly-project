import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Wind, LayoutDashboard, ClipboardList } from "lucide-react";

const ONBOARDING_DONE_KEY = "moodly_onboarding_done";
const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const finish = () => {
    localStorage.setItem(ONBOARDING_DONE_KEY, "true");
  };

  const goTo = (path: string) => {
    finish();
    navigate(path);
  };

  if (localStorage.getItem(ONBOARDING_DONE_KEY)) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${i === step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {step === 0 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">{t("onboarding.welcomeTitle")}</h2>
              <p className="text-muted-foreground">{t("onboarding.welcomeDesc")}</p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => goTo("/")}>
                  {t("onboarding.skip")}
                </Button>
                <Button onClick={() => setStep(1)}>
                  {t("onboarding.next")}
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">{t("onboarding.startTitle")}</h2>
              <p className="text-muted-foreground">{t("onboarding.startDesc")}</p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => goTo("/")}>
                  {t("onboarding.skip")}
                </Button>
                <Button onClick={() => setStep(2)}>
                  {t("onboarding.next")}
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-foreground font-serif">{t("onboarding.chooseTitle")}</h2>
              <p className="text-muted-foreground text-sm">{t("onboarding.startDesc")}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => goTo("/breathing")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Wind className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("onboarding.chooseBreathing")}</p>
                    <p className="text-xs text-muted-foreground">{t("breathing.subtitle")}</p>
                  </div>
                </button>
                <button
                  onClick={() => goTo("/")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("onboarding.chooseDashboard")}</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.title")}</p>
                  </div>
                </button>
                <button
                  onClick={() => goTo("/tests")}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-all active:scale-[0.97] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("onboarding.chooseTest")}</p>
                    <p className="text-xs text-muted-foreground">{t("tests.title")}</p>
                  </div>
                </button>
              </div>
              <Button variant="ghost" onClick={() => goTo("/")}>
                {t("onboarding.skip")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
