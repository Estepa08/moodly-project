import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Parameter {
  id: string;
  name: string;
  description?: string;
  unit?: string;
}

interface Entry {
  id: string;
  parameterId: string;
  value: number;
  note?: string;
  createdAt: string;
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
  onLogout: () => void;
}

export default function Dashboard({ navigate, onLogout }: Props) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [entryValue, setEntryValue] = useState("");
  const [entryNote, setEntryNote] = useState("");

  const { data: params } = useQuery<Parameter[]>({
    queryKey: ["parameters"],
    queryFn: () => api.parameters.list() as Promise<Parameter[]>,
  });

  const { data: entries } = useQuery<Entry[]>({
    queryKey: ["entries", selectedParam],
    queryFn: () => api.entries.list({ parameterId: selectedParam || undefined }) as Promise<Entry[]>,
  });

  const createEntry = useMutation({
    mutationFn: () =>
      api.entries.create({
        parameterId: selectedParam,
        value: parseFloat(entryValue),
        note: entryNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setEntryValue("");
      setEntryNote("");
    },
  });

  const navItems = [
    { label: t("nav.dashboard"), page: "dashboard" as const },
    { label: t("nav.tests"), page: "tests" as const },
    { label: t("nav.results"), page: "test-results" as const },
    { label: t("nav.reports"), page: "reports" as const },
    { label: t("nav.feedback"), page: "feedback" as const },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">{t("common.moodly")}</h1>
        <div className="flex gap-2">
          {navItems.map((item) => (
            <Button
              key={item.page}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.page)}
            >
              {item.label}
            </Button>
          ))}
          <div className="flex items-center gap-1 text-xs">
            <button
              className={`px-1.5 py-0.5 rounded ${i18n.language === "en" ? "text-primary font-semibold" : "text-muted-foreground"}`}
              onClick={() => i18n.changeLanguage("en")}
            >
              EN
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              className={`px-1.5 py-0.5 rounded ${i18n.language === "ru" ? "text-primary font-semibold" : "text-muted-foreground"}`}
              onClick={() => i18n.changeLanguage("ru")}
            >
              RU
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            {t("common.logout")}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickEntry")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dashboard.parameter")}</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-neumorphic-inset"
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value)}
              >
                <option value="">{t("dashboard.select")}</option>
                {params?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.unit ? `(${p.unit})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.value")}</Label>
              <Input
                type="number"
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                placeholder={t("dashboard.valuePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.note")}</Label>
              <Input
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
                placeholder={t("dashboard.notePlaceholder")}
              />
            </div>
            <Button
              className="w-full"
              disabled={!selectedParam || !entryValue || createEntry.isPending}
              onClick={() => createEntry.mutate()}
            >
              {createEntry.isPending ? t("common.saving") : t("dashboard.saveEntry")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {entries && entries.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={entries.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="createdAt"
                    tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
                    fontSize={10}
                    stroke="#a1a1aa"
                  />
                  <YAxis fontSize={10} stroke="#a1a1aa" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8B5CF6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noEntries")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
