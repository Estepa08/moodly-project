import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useRewardPractice, PracticeSource, useCreatureState } from "../features/gamification";
import { useParameters } from "../hooks/useParameters";
import { useEntries, useCreateEntry } from "../hooks/useEntries";
import { RatingScaleSelector } from "../features/mood-entry";
import { RATING_LEVELS, levelForValue } from "../lib/ratingLevels";
import { ParameterName } from "../lib/constants";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Flame, BarChart3, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendPreview } from "../features/analytics";
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

const PARAM_NAME = "Mood";
const MOOD_LEVELS = RATING_LEVELS[ParameterName.Mood]!;

export default function ThoughtJournalPage() {
  const { t, i18n } = useTranslation();
  const { data: params } = useParameters();
  const rewardPractice = useRewardPractice();
  const { data: creature } = useCreatureState();

  const moodParam = useMemo(() => params?.find((p) => p.name === PARAM_NAME), [params]);
  const { data: entries, isLoading: entriesLoading } = useEntries(
    moodParam ? { parameterId: moodParam.id } : undefined,
  );

  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [value, setValue] = useState(5);
  const [alternative, setAlternative] = useState("");
  const [streak, setStreak] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<string>("3m");
  const [chartOpen, setChartOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    if (creature) {
      setStreak(creature.streak ?? 0);
    }
  }, [creature]);

  const createEntry = useCreateEntry(() => {
    rewardPractice.mutate(PracticeSource.ThoughtJournal, {
      onSuccess: (data) => {
        if (data?.state?.streak !== undefined) {
          setStreak(data.state.streak);
        }
      },
    });
  });

  const buildNote = () => {
    const parts: string[] = [];
    if (situation.trim()) {
      parts.push(`${t("thoughtJournal.lblSituation")}\n${situation.trim()}`);
    }
    if (thought.trim()) {
      parts.push(`${t("thoughtJournal.lblThought")}\n${thought.trim()}`);
    }
    if (alternative.trim()) {
      parts.push(`${t("thoughtJournal.lblAlternative")}\n${alternative.trim()}`);
    }
    return parts.join("\n\n");
  };

  const handleSave = () => {
    if (!moodParam) return;
    createEntry.mutate(
      {
        parameterId: moodParam.id,
        value,
        note: buildNote() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("thoughtJournal.saved"));
          setSituation("");
          setThought("");
          setAlternative("");
          setValue(5);
        },
      },
    );
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
      const values = row._values as Record<string, number[]>;
      if (!values.Mood) values.Mood = [];
      values.Mood.push(e.value);
      row.Mood = values.Mood.reduce((s, v) => s + v, 0) / values.Mood.length;
    }
    return Array.from(grouped.values());
  }, [entries, i18n.language, chartPeriod]);

  const last7 = useMemo(() => {
    const arr: (number | null)[] = new Array(7).fill(null);
    for (const e of entries ?? []) {
      const dayIndex = Math.floor((Date.now() - new Date(e.createdAt).getTime()) / 86_400_000);
      if (dayIndex >= 0 && dayIndex < 7) {
        const idx = 6 - dayIndex;
        arr[idx] = arr[idx] === null ? e.value : (arr[idx] + e.value) / 2;
      }
    }
    return arr;
  }, [entries]);

  const activeDays = last7.filter((v): v is number => v !== null).length;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("thoughtJournal.today");
    if (diffDays === 1) return t("thoughtJournal.yesterday");
    return d.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isLoading = !moodParam || (entriesLoading && !entries);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto">
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t("thoughtJournal.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("thoughtJournal.subtitle")}</p>
        {streak > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-accent font-medium mt-2">
            <Flame aria-hidden="true" className="w-4 h-4" />
            <span>{t("thoughtJournal.streak", { count: streak })}</span>
          </div>
        )}
      </div>

      <TrendPreview
        title={t("trendPreview.title")}
        label={t("trendPreview.days", { active: activeDays, total: 7 })}
        days={last7}
        icon={<BarChart3 aria-hidden="true" className="w-4 h-4 text-primary" />}
        expanded={chartOpen}
        onToggle={() => setChartOpen((o) => !o)}
        showLabel={t("trendPreview.show")}
        hideLabel={t("trendPreview.hide")}
        disabled={historyEntries.length === 0}
      >
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
                domain={[0, 10]}
                ticks={[0, 5, 10]}
                fontSize={11}
                stroke="hsl(var(--chart-tick))"
                width={36}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatLabel={(name, rawValue, row) => {
                      const value = rawValue as number;
                      const level = levelForValue(MOOD_LEVELS, value);
                      const label = t(level.labelKey);
                      const values = (row?._values as Record<string, number[]> | undefined)?.[
                        name
                      ];
                      if (values && values.length > 1) {
                        return `${label}: ${value.toFixed(1)} (${values.join(", ")})`;
                      }
                      return `${label}: ${value}`;
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
          <EmptyState icon={BarChart3} title={t("thoughtJournal.emptyChart")} />
        )}
      </TrendPreview>

      <Card className="shadow-neumorphic">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="tj-situation" className="text-sm font-medium text-foreground">
              {t("thoughtJournal.lblSituation")}
            </label>
            <Textarea
              id="tj-situation"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder={t("thoughtJournal.situationPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tj-thought" className="text-sm font-medium text-foreground">
              {t("thoughtJournal.lblThought")}
            </label>
            <Textarea
              id="tj-thought"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder={t("thoughtJournal.thoughtPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t("thoughtJournal.lblFeel")}</p>
            <RatingScaleSelector
              levels={MOOD_LEVELS}
              value={value}
              onChange={setValue}
              disabled={createEntry.isPending}
              ariaLabel={t("thoughtJournal.lblFeel")}
              compact
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="tj-alternative" className="text-sm font-medium text-foreground">
                {t("thoughtJournal.lblAlternative")}
              </label>
              <span className="text-xs text-muted-foreground">
                {t("thoughtJournal.alternativeOptional")}
              </span>
            </div>
            <Textarea
              id="tj-alternative"
              value={alternative}
              onChange={(e) => setAlternative(e.target.value)}
              placeholder={t("thoughtJournal.alternativePlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Button onClick={handleSave} disabled={createEntry.isPending} className="w-full">
              {t("thoughtJournal.save")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t("thoughtJournal.saveHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="w-4 h-4 text-primary" />
            {t("thoughtJournal.historyTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyEntries.length > 0 ? (
            <div className="space-y-2">
              {(showAllHistory ? historyEntries : historyEntries.slice(0, 3)).map((e) => {                const level = levelForValue(MOOD_LEVELS, e.value);
                const Icon = level.Icon;
                return (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-neumorphic-sm">
                    <span className="w-6 h-6 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <Icon
                        aria-hidden="true"
                        className={`w-5 h-5 ${
                          e.value >= 7.5
                            ? "text-accent"
                            : e.value >= 5
                              ? "text-primary"
                              : "text-destructive/70"
                        }`}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</p>
                      {e.note ? (
                        <p className="text-sm text-foreground whitespace-pre-line line-clamp-3">
                          {e.note}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 italic">
                          {t("thoughtJournal.noNote")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={ClipboardList} title={t("thoughtJournal.noEntries")} />
          )}
          {historyEntries.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllHistory((s) => !s)}
              aria-expanded={showAllHistory}
              className="mt-3 flex items-center justify-center gap-1 w-full py-2 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showAllHistory ? t("thoughtJournal.hideAll") : t("thoughtJournal.showAll", { count: historyEntries.length })}
              {showAllHistory ? (
                <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
