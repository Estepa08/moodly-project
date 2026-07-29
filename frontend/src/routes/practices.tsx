import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { useStalePractices } from "../hooks/useStalePractices";
import { PracticeSource } from "../features/gamification/practice.enums";
import { Wind, Heart, BrainCircuit, Moon, Scale, BookOpen, Clock } from "lucide-react";

const PATH_TO_SOURCE: Record<string, PracticeSource> = {
  "/thought-journal": PracticeSource.ThoughtJournal,
  "/gratitude-journal": PracticeSource.Gratitude,
  "/distortions": PracticeSource.Distortions,
  "/sleep-hygiene": PracticeSource.SleepHygiene,
  "/cost-benefit-analysis": PracticeSource.Cba,
  "/breathing": PracticeSource.Breathing,
};

const PRACTICES = [
  {
    path: "/thought-journal",
    icon: BookOpen,
    labelKey: "nav.thoughtJournal",
    descKey: "practices.descThoughtJournal",
    timeKey: "practices.timeThoughtJournal",
    categoryKey: "practices.categoryMind",
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
  {
    path: "/breathing",
    icon: Wind,
    labelKey: "nav.breathing",
    descKey: "practices.descBreathing",
    timeKey: "practices.timeBreathing",
    categoryKey: "practices.categoryBody",
  },
];

export default function PracticesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isStale } = useStalePractices(3);

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
          const source = PATH_TO_SOURCE[p.path];
          const stale = source ? isStale(source) : false;
          return (
            <Card
              key={p.path}
              className={`shadow-elevation-2 cursor-pointer hover:shadow-elevation-3 transition-all duration-150 active:scale-[0.97] ${stale ? 'border-l-2 border-primary' : ''}`}
              onClick={() => navigate(p.path)}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-elevation-inset ${stale ? 'bg-primary/20' : 'bg-primary/10'}`}>
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
                  {stale && (
                    <p className="text-xs text-primary mt-1">{t("practices.staleLabel")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
