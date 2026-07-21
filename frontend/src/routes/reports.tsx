import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useState } from "react";

interface Report {
  id: string;
  format: string;
  status: string;
  periodFrom: string;
  periodTo: string;
  createdAt: string;
  downloadUrl?: string;
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
}

export default function ReportsPage({ navigate }: Props) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  const { data: reports } = useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: () => api.reports.list() as Promise<Report[]>,
  });

  const createReport = useMutation({
    mutationFn: () => api.reports.create({ format, periodFrom, periodTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">{t("reports.title")}</h1>
        <Button variant="ghost" onClick={() => navigate("dashboard")}>{t("common.back")}</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reports.format")}</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-neumorphic-inset"
              value={format}
              onChange={(e) => setFormat(e.target.value as "pdf" | "csv")}
            >
              <option value="pdf">{t("reports.pdf")}</option>
              <option value="csv">{t("reports.csv")}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period-from">{t("reports.from")}</Label>
              <Input id="period-from" type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-to">{t("reports.to")}</Label>
              <Input id="period-to" type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
            </div>
          </div>
          <Button disabled={!periodFrom || !periodTo || createReport.isPending} onClick={() => createReport.mutate()}>
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
    </div>
  );
}
