import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRewardPractice, PracticeSource, useCreatureState } from "../features/gamification";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry } from "../hooks/useEntries";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BookOpen, Flame, BarChart3, ClipboardList } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "../lib/chart-tooltip";
import PeriodSelector from "../components/ui/PeriodSelector";
import EmptyState from "../components/ui/empty-state";
import { LoadingCard } from "../components/ui/loading-card";
import { formatChartDate } from "../lib/utils";
import { isWithinLastDays } from "../lib/utils";

const THOUGHT_JOURNAL_PERIODS = [
  { key: "1m", label: "1m" },
  { key: "3m", label: "3m" },
  { key: "6m", label: "6m" },
  { key: "all", label: "All" },
] as const;

const EMOJIS = ["😢", "😔", "😐", "🙂", "😊"];

const MOODS = [
  { emoji: "😢", label: "Rough", value: 0 },
  { emoji: "😔", label: "Low", value: 1 },
  { emoji: "😐", label: "Okay", value: 2 },
  { emoji: "🙂", label: "Good", value: 3 },
  { emoji: "😊", label: "Great", value: 4 },
];

const PARAM_NAME = "Thought Journal Mood";

export default function ThoughtJournalPage() {
  const { t, i18n } = useTranslation();
  const { data: params } = useParameters();
  const rewardPractice = useRewardPractice();
  const { data: creature } = useCreatureState();

  const tjParam = useMemo(() => params?.find((p) => p.name === PARAM_NAME), [params]);
  const { data: entries, isLoading: entriesLoading } = useEntries(
    tjParam ? { parameterId: tjParam.id } : undefined,
  );

  const todayEntry = useMemo(() => {
    if (!entries) return null;
    const today = new Date().toISOString().slice(0, 10);
    return entries.some((e) => e.createdAt.slice(0, 10) === today);
  }, [entries]);

  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<string>("3m");

  useEffect(() => {
    if (creature) {
      setStreak(creature.streak ?? 0);
    }
  }, [creature]);

  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.ThoughtJournal, {
      onSuccess: (data) => {
        setSaved(true);
        if (data?.state?.streak !== undefined) {
          setStreak(data.state.streak);
        }
      },
    });
  });

  const handleSave = () => {
    if (!tjParam || selected === null) return;
    createEntry.mutate({
      parameterId: tjParam.id,
      value: selected,
      note: note || undefined,
    });
  };

  const historyEntries = useMemo(() => {
    if (!entries) return [];
    return [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [entries]);

  const chartData = useMemo(() => {
    if (!entries) return [];
    const showYear = chartPeriod === "all";
    const chartDays = chartPeriod === "all" ? Infinity : parseInt(chartPeriod) * 30;
    const sorted = [...entries]
      .filter((e) => (chartDays === Infinity ? true : isWithinLastDays(e.createdAt, chartDays)))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const grouped = new Map<string, Record<string, unknown>>();
    for (const e of sorted) {
      const day = formatChartDate(new Date(e.createdAt), i18n.language, showYear);
      if (!grouped.has(day)) {
        grouped.set(day, { date: day, _values: {} as Record<string, number[]> });
      }
      const row = grouped.get(day)!;
      const values = (row._values as Record<string, number[]>);
      if (!values.Mood) values.Mood = [];
      values.Mood.push(e.value);
      row.Mood = values.Mood.reduce((s, v) => s + v, 0) / values.Mood.length;
    }
    return Array.from(grouped.values());
  }, [entries, i18n.language, chartPeriod]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("thoughtJournal.today");
    if (diffDays === 1) return t("thoughtJournal.yesterday");
    return d.toLocaleDateString(
      i18n.language === "ru" ? "ru-RU" : "en-US",
      { month: "short", day: "numeric" },
    );
  };

  const isSaved = saved || todayEntry === true;
  const isLoading = !tjParam || (entriesLoading && !entries);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("thoughtJournal.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("thoughtJournal.subtitle")}
        </p>
      </div>

      {isSaved ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">
              {t("thoughtJournal.saved")}
            </p>
            {streak > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-accent font-medium">
                <Flame className="w-4 h-4" />
                <span>{t("thoughtJournal.streak", { count: streak })}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {t("thoughtJournal.alreadySaved")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-4">
                {t("thoughtJournal.moodPrompt")}
              </p>
              <div className="flex justify-center gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelected(mood.value)}
                    className={`
                      w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
                      text-2xl sm:text-3xl transition-all duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      ${selected === mood.value
                        ? "bg-primary/20 shadow-elevation-2 scale-110 ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80 shadow-neumorphic-sm active:scale-[0.97]"
                      }
                    `}
                    aria-label={mood.label}
                  >
                    {mood.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {t("thoughtJournal.noteLabel")}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("thoughtJournal.notePlaceholder")}
                rows={3}
                className="w-full rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={selected === null}
              className="w-full"
            >
              {t("thoughtJournal.save")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            {t("thoughtJournal.historyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyEntries.length > 0 ? (
            <div className="space-y-2">
              {historyEntries.slice(0, 10).map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {EMOJIS[Math.round(e.value)] ?? "😐"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.createdAt)}
                    </p>
                    {e.note ? (
                      <p className="text-sm text-foreground truncate">{e.note}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic">
                        {t("thoughtJournal.noNote")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={t("thoughtJournal.noEntries")}
            />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            {t("thoughtJournal.chartTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <PeriodSelector
              options={THOUGHT_JOURNAL_PERIODS.map((p) => ({ key: p.key, label: p.label }))}
              value={chartPeriod}
              onChange={setChartPeriod}
              size="sm"
            />
          </div>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis
                  dataKey="date"
                  fontSize={11}
                  stroke="hsl(var(--chart-tick))"
                  interval={Math.max(1, Math.floor(chartData.length / 5))}
                />
                <YAxis
                  domain={[0, 4]}
                  ticks={[0, 1, 2, 3, 4]}
                  tickFormatter={(v: number) => EMOJIS[v] ?? ""}
                  fontSize={14}
                  stroke="hsl(var(--chart-tick))"
                  width={36}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatLabel={(name, value, row) => {
                        const values = (row?._values as Record<string, number[]> | undefined)?.[name];
                        if (values && values.length > 1) {
                          return `${EMOJIS[Math.round(value as number)] ?? "😐"} ${t("dashboard.mood")}: ${(value as number).toFixed(1)} (${values.join(", ")})`;
                        }
                        return `${EMOJIS[Math.round(value as number)] ?? "😐"} ${t("dashboard.mood")}: ${value}`;
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="Mood"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={BarChart3}
              title={t("thoughtJournal.emptyChart")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
