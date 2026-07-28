import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Wind, Heart, BrainCircuit, Moon, Scale } from "lucide-react";

const PRACTICES = [
  {
    path: "/breathing",
    icon: Wind,
    labelKey: "nav.breathing",
    descKey: "breathing.descriptionBox",
    timeKey: "practices.timeBreathing",
  },
  {
    path: "/gratitude-journal",
    icon: Heart,
    labelKey: "nav.gratitude",
    descKey: "practices.descGratitude",
    timeKey: "practices.timeGratitude",
  },
  {
    path: "/distortions",
    icon: BrainCircuit,
    labelKey: "nav.distortions",
    descKey: "practices.descDistortions",
    timeKey: "practices.timeDistortions",
  },
  {
    path: "/sleep-hygiene",
    icon: Moon,
    labelKey: "nav.sleepHygiene",
    descKey: "practices.descSleepHygiene",
    timeKey: "practices.timeSleepHygiene",
  },
  {
    path: "/cost-benefit-analysis",
    icon: Scale,
    labelKey: "nav.cba",
    descKey: "practices.descCba",
    timeKey: "practices.timeCba",
  },
];

export default function PracticesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("nav.practices")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("practices.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRACTICES.map((p) => {
          const Icon = p.icon;
          return (
            <Card
              key={p.path}
              className="shadow-neumorphic cursor-pointer hover:shadow-neumorphic-sm transition-all duration-150 active:scale-[0.97]"
              onClick={() => navigate(p.path)}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t(p.labelKey)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(p.descKey)}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">{t(p.timeKey)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
