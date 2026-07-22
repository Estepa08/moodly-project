import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useReports, useCreateReport } from "../hooks/useReports";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Spinner from "../components/ui/spinner";

const PRESETS = [
  { key: "1m", labelKey: "dashboard.oneMonth", days: 30 },
  { key: "3m", labelKey: "dashboard.threeMonths", days: 90 },
  { key: "6m", labelKey: "reports.sixMonths", days: 180 },
] as const;

export default function ReportsPage() {
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

  const handleManualDate = () => {
    setDatePreset("");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground font-serif">{t("reports.title")}</h1>

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
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
              <Input id="period-from" type="date" value={periodFrom} onChange={(e) => { handleManualDate(); setPeriodFrom(e.target.value); }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-to">{t("reports.to")}</Label>
              <Input id="period-to" type="date" value={periodTo} onChange={(e) => { handleManualDate(); setPeriodTo(e.target.value); }} />
            </div>
          </div>

          <Button disabled={!periodFrom || !periodTo || createReport.isPending} onClick={() => createReport.mutate({ format, periodFrom, periodTo })}>
            {createReport.isPending ? t("common.generating") : t("reports.submit")}
          </Button>
        </CardContent>
      </Card>

      {reports?.map((r) => (
        <Card key={r.id}>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium capitalize">{r.format}</p>
              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")} — {r.status}</p>
            </div>
            {r.status === "ready" && (
              <Button size="sm" variant="outline" asChild>
                <a href={api.reports.download(r.id)} download>{t("reports.download")}</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {reports?.length === 0 && (
        <p className="text-muted-foreground text-center py-8">{t("reports.noReports")}</p>
      )}
    </div>
  );
}
