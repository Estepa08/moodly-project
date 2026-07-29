import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { components } from "../../lib/api-types";
import { toast } from "sonner";
import { Heart, Smile } from "lucide-react";
import type { CreateEntryMutation } from "../../lib/app-types";
import { isWithinLastDays, cn, formatDateShort } from "../../lib/utils";
import { CorrelationChart } from "../analytics";
import { GratitudeCategory } from "../../lib/gratitudePrompts";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";

interface GratitudeJournalProps {
  parameterId: string | undefined;
  entries: components["schemas"]["Entry"][];
  moodEntries: components["schemas"]["Entry"][];
  createEntry: CreateEntryMutation;
  limit?: number;
  hideTitle?: boolean;
}

const ALL_CATEGORIES = Object.values(GratitudeCategory);

export default function GratitudeJournal({
  parameterId,
  entries,
  moodEntries,
  createEntry,
  limit = 5,
  hideTitle = false,
}: GratitudeJournalProps) {
  const { t, i18n } = useTranslation();
  const [note, setNote] = useState("");
  const [activePrompt, setActivePrompt] = useState<GratitudeCategory | null>(null);
  const [showChart, setShowChart] = useState(false);

  const correlationData = useMemo(() => {
    const byDay = new Map<string, { gratitude: number; mood?: number }>();
    for (const e of entries) {
      const key = formatDateShort(new Date(e.createdAt), i18n.language, { day: "2-digit", month: "2-digit", year: "numeric" });
      if (!byDay.has(key)) byDay.set(key, { gratitude: e.value });
    }
    for (const e of moodEntries) {
      const key = formatDateShort(new Date(e.createdAt), i18n.language, { day: "2-digit", month: "2-digit", year: "numeric" });
      const existing = byDay.get(key);
      if (existing) existing.mood = e.value;
    }
    return Array.from(byDay.entries())
      .filter(([, v]) => v.mood !== undefined)
      .map(([date, v]) => ({ date, gratitude: v.gratitude, mood: v.mood! }))
      .slice(-limit);
  }, [entries, moodEntries, i18n.language, limit]);

  const recentEntries = useMemo(
    () => entries.slice(-limit).reverse(),
    [entries, limit],
  );

  const weekCount = useMemo(
    () => entries.filter((e) => isWithinLastDays(e.createdAt, 7)).length,
    [entries],
  );

  const handlePromptSelect = (category: GratitudeCategory) => {
    setActivePrompt(activePrompt === category ? null : category);
  };

  const handleSave = async () => {
    if (!parameterId || !createEntry) return;
    createEntry.mutate(
      { parameterId, value: 1, note: note || activePrompt || undefined },
      { onSuccess: () => { setNote(""); setActivePrompt(null); toast.success(t("dashboard.gratitudeSaved")); } },
    );
  };

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <h3 className="text-sm font-semibold text-foreground">{t("dashboard.gratitudeJournal")}</h3>
      )}

      <Card className="shadow-neumorphic">
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs text-muted-foreground">{t("dashboard.gratitudePrompt")}</p>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handlePromptSelect(cat)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activePrompt === cat ? "bg-primary/10 text-primary shadow-neumorphic-sm" : "bg-muted text-muted-foreground shadow-neumorphic-sm hover:text-foreground",
                )}
              >
                {t(`gratitudePrompts.${cat}`)}
              </button>
            ))}
          </div>
          {activePrompt && (
            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
              {t(`gratitudePrompts.${activePrompt}Hint`)}
            </p>
          )}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("dashboard.gratitudePlaceholder")}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!note.trim() || createEntry.isPending}>
              <Heart className="w-4 h-4 mr-1.5" />
              {t("dashboard.saveGratitude")}
            </Button>
            <Button variant="ghost" onClick={() => setShowChart(!showChart)}>
              <Smile className="w-4 h-4 mr-1.5" />
              {t(showChart ? "dashboard.hideCorrelation" : "dashboard.showCorrelation")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showChart && correlationData.length > 0 && (
        <CorrelationChart
          data={correlationData}
          lines={[
            { dataKey: "gratitude", stroke: "hsl(var(--accent))", label: t("dashboard.gratitude") },
            { dataKey: "mood", stroke: "hsl(var(--primary))", label: t("dashboard.mood") },
          ]}
        />
      )}

      {weekCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {t("dashboard.thisWeekGratitude", { count: weekCount })}
        </p>
      )}

      {recentEntries.length > 0 && (
        <div className="space-y-2">
          {recentEntries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 p-3 rounded-xl bg-card shadow-neumorphic-sm">
              <Heart className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-foreground break-words">{entry.note || entry.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateShort(new Date(entry.createdAt), i18n.language)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentEntries.length === 0 && (
        <EmptyState icon={Heart} title={t("dashboard.noGratitudeYet")} />
      )}
    </div>
  );
}
