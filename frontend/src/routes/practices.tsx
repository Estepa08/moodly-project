import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Wind, Heart, BrainCircuit, Moon, Scale, Clock } from "lucide-react";

const PRACTICES = [
  {
    path: "/breathing",
    icon: Wind,
    labelKey: "nav.breathing",
    descKey: "practices.descBreathing",
    timeKey: "practices.timeBreathing",
    categoryKey: "practices.categoryBody",
  },
  {
    path: "/gratitude-journal",
    icon: Heart,
    labelKey: "nav.gratitude",
    descKey: "practices.descGratitude",
    timeKey: "practices.timeGratitude",
    categoryKey: "practices.categoryMind",
  },
  {
    path: "/distortions",
    icon: BrainCircuit,
    labelKey: "nav.distortions",
    descKey: "practices.descDistortions",
    timeKey: "practices.timeDistortions",
    categoryKey: "practices.categoryMind",
  },
  {
    path: "/sleep-hygiene",
    icon: Moon,
    labelKey: "nav.sleepHygiene",
    descKey: "practices.descSleepHygiene",
    timeKey: "practices.timeSleepHygiene",
    categoryKey: "practices.categoryBody",
  },
  {
    path: "/cost-benefit-analysis",
    icon: Scale,
    labelKey: "nav.cba",
    descKey: "practices.descCba",
    timeKey: "practices.timeCba",
    categoryKey: "practices.categoryMind",
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
              className="shadow-elevation-2 cursor-pointer hover:shadow-elevation-3 transition-all duration-150 active:scale-[0.97]"
              onClick={() => navigate(p.path)}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 shadow-elevation-inset">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                    {t(p.categoryKey)}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{t(p.labelKey)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(p.descKey)}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-1.5">
                    <Clock className="w-3 h-3" />
                    {t(p.timeKey)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
