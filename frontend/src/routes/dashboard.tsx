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
import RadarChart from "../components/RadarChart";
import type { DistortionEntry } from "../components/RadarChart";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileText,
  MessageSquare,
  LogOut,
} from "lucide-react";

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

interface TestResult {
  id: string;
  testId: string;
  score: number;
  interpretation: string;
  recommendation: string;
  flags?: {
    distortions?: Record<string, { score: number; level: string }>;
    templateKey?: string;
  };
  completedAt: string;
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
  onLogout: () => void;
}

const navItems = [
  { labelKey: "nav.dashboard", page: "dashboard" as const, icon: LayoutDashboard },
  { labelKey: "nav.tests", page: "tests" as const, icon: ClipboardList },
  { labelKey: "nav.results", page: "test-results" as const, icon: BarChart3 },
  { labelKey: "nav.reports", page: "reports" as const, icon: FileText },
  { labelKey: "nav.feedback", page: "feedback" as const, icon: MessageSquare },
];

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

  const { data: testResults } = useQuery<TestResult[]>({
    queryKey: ["testResults"],
    queryFn: () => api.testResults.list() as Promise<TestResult[]>,
  });

  const cdResult = testResults?.find((r) => r.flags?.distortions);
  const cdDistortions = cdResult?.flags?.distortions;
  const radarData: DistortionEntry[] = cdDistortions
    ? Object.entries(cdDistortions).map(([key, val]) => ({ key, score: val.score }))
    : [];

  const today = new Date().toDateString();
  const todaysEntries = entries?.filter(
    (e) => new Date(e.createdAt).toDateString() === today,
  );
  const latestEntry = todaysEntries && todaysEntries.length > 0
    ? todaysEntries[todaysEntries.length - 1]
    : entries && entries.length > 0
      ? entries[entries.length - 1]
      : null;

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

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border shadow-neumorphic-inset p-4 gap-2">
        <div className="text-lg font-serif font-bold text-primary mb-6 px-3" />
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => navigate(item.page)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{t(item.labelKey)}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 active:scale-[0.97] cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t("common.logout")}</span>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md mx-4 mt-4 mb-2 rounded-xl shadow-neumorphic px-5 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-primary font-serif">{t("common.moodly")}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs md:hidden">
              {navItems.slice(0, 4).map((item) => (
                <Button key={item.page} variant="ghost" size="sm" onClick={() => navigate(item.page)}>
                  <item.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button
                className={`px-1.5 py-0.5 rounded cursor-pointer ${i18n.language === "en" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => i18n.changeLanguage("en")}
              >
                EN
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                className={`px-1.5 py-0.5 rounded cursor-pointer ${i18n.language === "ru" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => i18n.changeLanguage("ru")}
              >
                RU
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-8 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="shadow-neumorphic-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("dashboard.moodToday")}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {latestEntry ? latestEntry.value : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-neumorphic-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("dashboard.testsTaken")}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {testResults?.length ?? "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-neumorphic-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("dashboard.lastScore")}</p>
                <p className="text-2xl font-bold text-accent mt-1">
                  {testResults && testResults.length > 0 ? testResults[0].score : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-neumorphic-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{t("dashboard.entriesCount")}</p>
                <p className="text-2xl font-bold text-accent mt-1">
                  {entries?.length ?? "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.cdProfile")}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadarChart data={radarData} />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("dashboard.quickEntry")}</CardTitle>
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
                <CardTitle className="text-base">{t("dashboard.history")}</CardTitle>
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
        </main>
      </div>
    </div>
  );
}
