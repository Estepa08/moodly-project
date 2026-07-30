import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReports, useCreateReport } from "../hooks/useReports";
import { useWeeklyDigest } from "../hooks/useWeeklyDigest";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Spinner from "../components/ui/spinner";
import EmptyState from "../components/ui/empty-state";
import { DigestCharts } from "../features/analytics";
import { AlertTriangle, RotateCcw, FileText, Wind, Heart, Moon, Brain, Scale, BookOpen, Activity, BarChart3 } from "lucide-react";
import { cn } from "../lib/utils";
import type { components } from "../lib/api-types";

type Report = components["schemas"]["Report"];

const TABS = [
  { key: "reports", labelKey: "reports.tabGenerate" },
  { key: "weekly", labelKey: "reports.tabWeekly" },
] as const;

const PRESETS = [
  { key: "1m", labelKey: "dashboard.oneMonth", days: 30 },
  { key: "3m", labelKey: "dashboard.threeMonths", days: 90 },
  { key: "6m", labelKey: "reports.sixMonths", days: 180 },
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "reports.statusPending",
  ready: "reports.statusReady",
  failed: "reports.statusFailed",
};

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

function WeeklyDigestTab() {
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
    month: "long", day: "numeric",
  });
  const endStr = new Date(digest.endDate).toLocaleDateString(undefined, {
    month: "long", day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{startStr} — {endStr}</p>
      </div>

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("digest.overviewTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary font-serif tabular-nums">{digest.totalEntries}</p>
              <p className="text-xs text-muted-foreground">{t("digest.totalEntries")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-accent font-serif tabular-nums">{digest.checkInDays}</p>
              <p className="text-xs text-muted-foreground">{t("digest.checkInDays")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary font-serif tabular-nums">+{digest.creatureXpGained}</p>
              <p className="text-xs text-muted-foreground">{t("digest.xpGained")}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-primary font-serif tabular-nums">{digest.creatureLevel}</p>
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
                <div key={key} className="rounded-xl bg-muted/50 p-3 flex items-center gap-3 max-sm:p-2">
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
                  <div key={source} className="rounded-xl bg-muted/50 p-3 flex items-center gap-3 max-sm:p-2">
                    <Icon aria-hidden="true" className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t(PRACTICE_LABELS[source] || source)}</p>
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
                <div key={test.testId} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <span className="text-sm font-medium text-foreground">{test.title}</span>
                  <span className="text-sm font-semibold text-primary tabular-nums">{test.score}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GenerateReportsTab() {
  const { t, i18n } = useTranslation();
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [datePreset, setDatePreset] = useState("");

  const { data: reports, isLoading } = useReports();
  const createReport = useCreateReport();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  const applyPreset = (key: string) => {
    setDatePreset(key);
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const from = new Date(today.getTime() - preset.days * 24 * 60 * 60 * 1000);
    setPeriodFrom(from.toISOString().split("T")[0]);
    setPeriodTo(today.toISOString().split("T")[0]);
  };

  const handleManualDate = () => setDatePreset("");

  const handleRetry = (r: Report) => {
    createReport.mutate({
      format: r.format as "pdf" | "csv",
      periodFrom: new Date(r.periodFrom).toISOString().split("T")[0],
      periodTo: new Date(r.periodTo).toISOString().split("T")[0],
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-format">{t("reports.format")}</Label>
            <select
              id="report-format"
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-neumorphic-inset"
              value={format}
              onChange={(e) => setFormat(e.target.value as "pdf" | "csv")}
            >
              <option value="pdf">{t("reports.pdf")}</option>
              <option value="csv">{t("reports.csv")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>{t("reports.period")}</Label>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-[color,background-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    datePreset === p.key
                      ? "bg-primary text-primary-foreground shadow-neumorphic-sm"
                      : "bg-card text-muted-foreground hover:text-primary shadow-neumorphic-sm"
                  }`}
                >
                  {t(p.labelKey)}
                </button>
              ))}
              <button
                onClick={handleManualDate}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-[color,background-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  !datePreset
                    ? "bg-primary text-primary-foreground shadow-neumorphic-sm"
                    : "bg-card text-muted-foreground hover:text-primary shadow-neumorphic-sm"
                }`}
              >
                {t("reports.custom")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period-from">{t("reports.from")}</Label>
              <Input
                id="period-from"
                type="date"
                value={periodFrom}
                onChange={(e) => { handleManualDate(); setPeriodFrom(e.target.value); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-to">{t("reports.to")}</Label>
              <Input
                id="period-to"
                type="date"
                value={periodTo}
                onChange={(e) => { handleManualDate(); setPeriodTo(e.target.value); }}
              />
            </div>
          </div>

          <Button
            disabled={!periodFrom || !periodTo || createReport.isPending}
            onClick={() => createReport.mutate({ format, periodFrom, periodTo })}
          >
            {createReport.isPending ? t("common.generating") : t("reports.submit")}
          </Button>
        </CardContent>
      </Card>

      {reports?.map((r) => (
        <Card key={r.id} className={cn(r.status === "failed" && "border-destructive/30", r.status === "pending" && "opacity-70")}>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium capitalize">{r.format}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")} — {t(STATUS_LABELS[r.status] || r.status)}
              </p>
            </div>
            {r.status === "pending" && (
              <div className="flex items-center gap-2">
                <Spinner size={14} />
                <span className="text-xs text-muted-foreground">{t("reports.statusPending")}</span>
              </div>
            )}
            {r.status === "ready" && (
              <Button size="sm" variant="outline" asChild>
                <a href={api.reports.download(r.id)} download>{t("reports.download")}</a>
              </Button>
            )}
            {r.status === "failed" && (
              <div className="flex items-center gap-2">
                <AlertTriangle aria-hidden="true" className="w-4 h-4 text-destructive" />
                <Button size="sm" variant="outline" onClick={() => handleRetry(r)} disabled={createReport.isPending}>
                  <RotateCcw aria-hidden="true" className="w-3.5 h-3.5 mr-1" />
                  {t("reports.retry")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {reports?.length === 0 && <EmptyState icon={FileText} title={t("reports.noReports")} />}
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "weekly" ? "weekly" : "reports";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground font-serif">{t("reports.title")}</h1>

      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 shadow-neumorphic-inset" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-[color,background-color,box-shadow] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-neumorphic-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === "reports" ? <GenerateReportsTab /> : <WeeklyDigestTab />}
    </div>
  );
}
