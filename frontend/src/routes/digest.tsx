import { useTranslation } from "react-i18next";
import { useWeeklyDigest } from "../hooks/useWeeklyDigest";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Spinner from "../components/ui/spinner";
import EmptyState from "../components/ui/empty-state";
import { Wind, Heart, Moon, Brain, Scale, BookOpen, Activity, BarChart3 } from "lucide-react";
import { DigestCharts } from "../features/analytics";

const PRACTICE_ICONS: Record<string, typeof Wind> = {
  breathing: Wind,
  gratitude: Heart,
  sleepHygiene: Moon,
  distortions: Brain,
  cba: Scale,
  thoughtJournal: BookOpen,
};

const PRACTICE_LABELS: Record<string, string> = {
  breathing: "progress.activityBreathing",
  gratitude: "progress.activityGratitude",
  sleepHygiene: "progress.activitySleepHygiene",
  distortions: "progress.activityDistortions",
  cba: "progress.activityCba",
  thoughtJournal: "progress.activityThoughtJournal",
};

export default function DigestPage() {
  const { t } = useTranslation();
  const { data: digest, isLoading } = useWeeklyDigest();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (!digest) {
    return <EmptyState icon={BarChart3} title={t("digest.noData")} />;
  }

  const startStr = new Date(digest.startDate).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  const endStr = new Date(digest.endDate).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground font-serif">{t("digest.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {startStr} — {endStr}
        </p>
      </div>

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("digest.overviewTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary font-serif tabular-nums">
                {digest.totalEntries}
              </p>
              <p className="text-xs text-muted-foreground">{t("digest.totalEntries")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-accent font-serif tabular-nums">
                {digest.checkInDays}
              </p>
              <p className="text-xs text-muted-foreground">{t("digest.checkInDays")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary font-serif tabular-nums">
                +{digest.creatureXpGained}
              </p>
              <p className="text-xs text-muted-foreground">{t("digest.xpGained")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary font-serif tabular-nums">
                {digest.creatureLevel}
              </p>
              <p className="text-xs text-muted-foreground">{t("digest.creatureLevel")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <DigestCharts averages={digest.averages} practicesCompleted={digest.practicesCompleted} />

      {Object.keys(digest.averages).length > 0 && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("digest.averagesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
              {Object.entries(digest.averages).map(([key, val]) => (
                <div
                  key={key}
                  className="rounded-xl bg-muted/50 p-3 flex items-center gap-3 max-sm:p-2"
                >
                  <Activity aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{key}</p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Object.keys(digest.practicesCompleted).length > 0 && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("digest.practicesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
              {Object.entries(digest.practicesCompleted).map(([source, count]) => {
                const Icon = PRACTICE_ICONS[source] || Activity;
                return (
                  <div
                    key={source}
                    className="rounded-xl bg-muted/50 p-3 flex items-center gap-3 max-sm:p-2"
                  >
                    <Icon aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t(PRACTICE_LABELS[source] || source)}
                      </p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {digest.testsTaken.length > 0 && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("digest.testsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {digest.testsTaken.map((test) => (
                <div
                  key={test.testId}
                  className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
                >
                  <span className="text-sm font-medium text-foreground">{test.title}</span>
                  <span className="text-sm font-semibold text-primary tabular-nums">
                    {test.score}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
