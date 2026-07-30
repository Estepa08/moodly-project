import { useTranslation } from "react-i18next";
import {
  Wind, Heart, Moon, Brain, Scale, BookOpen,
  Activity, Target,
} from "lucide-react";
import { useWeeklyDigest } from "../hooks/useWeeklyDigest";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LoadingCard } from "../components/ui/loading-card";
import EmptyState from "../components/ui/empty-state";
import { DigestCharts } from "../features/analytics";
import type { WeeklyDigest as WeeklyDigestData } from "../lib/api";

function fmtDate(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtRange(startIso: string, endIso: string, locale: string) {
  return `${fmtDate(startIso, locale)} — ${fmtDate(endIso, locale)}`;
}

function cleanParamName(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const PRACTICE_CONFIG: Record<string, { icon: typeof Wind; labelKey: string }> = {
  breathing: { icon: Wind, labelKey: "progress.activityBreathing" },
  gratitude: { icon: Heart, labelKey: "progress.activityGratitude" },
  sleepHygiene: { icon: Moon, labelKey: "progress.activitySleepHygiene" },
  distortions: { icon: Brain, labelKey: "progress.activityDistortions" },
  cba: { icon: Scale, labelKey: "progress.activityCba" },
  thoughtJournal: { icon: BookOpen, labelKey: "progress.activityThoughtJournal" },
};

function OverviewGrid({ digest, t }: { digest: WeeklyDigestData; t: (key: string) => string }) {
  const items = [
    { label: t("digest.totalEntries"), value: digest.totalEntries, color: "text-primary" },
    { label: t("digest.checkInDays"), value: digest.checkInDays, color: "text-accent" },
    { label: t("digest.xpGained"), value: `+${digest.creatureXpGained}`, color: "text-primary" },
    { label: t("digest.creatureLevel"), value: digest.creatureLevel, color: "text-primary" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className={`text-2xl font-bold font-serif tabular-nums ${item.color}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

const PRACTICE_ORDER = ["breathing", "gratitude", "sleepHygiene", "distortions", "cba", "thoughtJournal"];

function PracticesGrid({
  practicesCompleted,
  t,
}: {
  practicesCompleted: Record<string, number>;
  t: (key: string) => string;
}) {
  const entries = PRACTICE_ORDER
    .filter((key) => practicesCompleted[key])
    .map((key) => ({
      key,
      icon: PRACTICE_CONFIG[key]?.icon,
      label: t(PRACTICE_CONFIG[key]?.labelKey ?? key),
      count: practicesCompleted[key],
    }));

  if (entries.length === 0) return null;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("digest.practicesTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
          {entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <div key={entry.key} className="rounded-xl bg-muted/50 p-3 flex items-center gap-3">
                {Icon && <Icon aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{entry.label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {entry.count}x
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AveragesGrid({
  averages,
  t,
}: {
  averages: Record<string, number>;
  t: (key: string) => string;
}) {
  const entries = Object.entries(averages);
  if (entries.length === 0) return null;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("digest.averagesTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
          {entries.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 rounded-xl bg-muted/50 p-2.5">
              <Activity aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{cleanParamName(key)}</p>
                <p className="text-sm font-semibold tabular-nums">{val.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TestsList({
  testsTaken,
  t,
}: {
  testsTaken: { testId: string; title: string; score: number; interpretation: string }[];
  t: (key: string) => string;
}) {
  if (testsTaken.length === 0) return null;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("digest.testsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {testsTaken.map((test) => (
            <div
              key={test.testId}
              className="flex items-center justify-between rounded-xl bg-muted/50 p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{test.title}</p>
                <p className="text-[11px] text-muted-foreground">{test.interpretation}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums ml-2">{test.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WeeklyDigest() {
  const { t, i18n } = useTranslation();
  const { data: digest, isLoading } = useWeeklyDigest();

  if (isLoading) {
    return <LoadingCard className="border-0 shadow-none" />;
  }

  if (!digest) {
    return (
      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target aria-hidden="true" className="w-4 h-4 text-primary" />
            {t("digest.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Target} title={t("digest.noData")} />
        </CardContent>
      </Card>
    );
  }

  const hasAverages = Object.keys(digest.averages).length > 0;
  const hasPractices = Object.values(digest.practicesCompleted).some((v) => v > 0);
  const hasTests = digest.testsTaken.length > 0;

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target aria-hidden="true" className="w-4 h-4 text-primary" />
          <span>
            {t("digest.title")}
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {fmtRange(digest.startDate, digest.endDate, i18n.language)}
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <OverviewGrid digest={digest} t={t} />

        <DigestCharts
          averages={digest.averages}
          practicesCompleted={digest.practicesCompleted}
        />

        {hasAverages && <AveragesGrid averages={digest.averages} t={t} />}

        {hasPractices && <PracticesGrid practicesCompleted={digest.practicesCompleted} t={t} />}

        {hasTests && <TestsList testsTaken={digest.testsTaken} t={t} />}
      </CardContent>
    </Card>
  );
}
