import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { components } from "../../lib/api-types";
import { toast } from "sonner";
import { Heart, Smile } from "lucide-react";
import type { CreateEntryMutation } from "../../lib/app-types";
import { isWithinLastDays, cn, formatDateShort } from "../../lib/utils";
import { CorrelationChart } from "../analytics";
import { GRATITUDE_PROMPT_CATEGORIES, type GratitudePromptCategory } from "../../lib/gratitudePrompts";
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
  const [activePrompt, setActivePrompt] = useState<GratitudePromptCategory | null>(null);
  const [showChart, setShowChart] = useState(false);

  const correlationData = useMemo(() => {
    const byDay = new Map<string, { gratitude: number; mood?: number }>();
    for (const e of entries) {
      const key = formatDateShort(new Date(e.createdAt), i18n.language, { day: "2-digit", month: "2-digit", year: "numeric" });
      const prev = byDay.get(key);
      byDay.set(key, { gratitude: (prev?.gratitude ?? 0) + 1, mood: prev?.mood });
    }
    for (const e of moodEntries) {
      const key = formatDateShort(new Date(e.createdAt), i18n.language, { day: "2-digit", month: "2-digit", year: "numeric" });
      const prev = byDay.get(key);
      byDay.set(key, { gratitude: prev?.gratitude ?? 0, mood: e.value });
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: formatDateShort(date, i18n.language),
        gratitude: Number(((Math.min(values.gratitude, 3) / 3) * 10).toFixed(1)),
        mood: values.mood,
      }));
  }, [entries, moodEntries, i18n.language]);

  const handleSave = () => {
    if (!parameterId) return;
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error(t("dashboard.gratitudeEmptyNote"));
      return;
    }
    createEntry.mutate(
      { parameterId, value: 1, note: trimmed },
      {
        onSuccess: () => {
          setNote("");
          setActivePrompt(null);
          toast.success(t("dashboard.gratitudeSaved"));
        },
      },
    );
  };

  const recent = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  const lastWeek = [...entries]
    .filter((e) => isWithinLastDays(e.createdAt, 7))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-4">
      <Card className="shadow-neumorphic">
        {!hideTitle && (
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              {t("dashboard.gratitudeJournal")}
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {GRATITUDE_PROMPT_CATEGORIES.map((category) => {
                const isActive = activePrompt === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActivePrompt(isActive ? null : category)}
                    aria-pressed={isActive}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "bg-primary/10 text-primary shadow-neumorphic-inset" : "bg-muted text-muted-foreground shadow-neumorphic-sm",
                    )}
                  >
                    {t(`dashboard.gratitudePrompts.${category}Label`)}
                  </button>
                );
              })}
            </div>
            <div
              className={cn("overflow-hidden transition-all duration-300", activePrompt ? "max-h-40 opacity-100" : "max-h-0 opacity-0")}
            >
              {activePrompt && (
                <div className="bg-muted/30 rounded-lg px-3 py-2 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{t("dashboard.gratitudePrompts.examplesLabel")}</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• {t(`dashboard.gratitudePrompts.${activePrompt}Example1`)}</li>
                    <li>• {t(`dashboard.gratitudePrompts.${activePrompt}Example2`)}</li>
                    <li>• {t(`dashboard.gratitudePrompts.${activePrompt}Example3`)}</li>
                  </ul>
                </div>
              )}
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={activePrompt ? t(`dashboard.gratitudePrompts.${activePrompt}Question`) : t("dashboard.gratitudePlaceholder")}
              rows={2}
              enterKeyHint="done"
              inputMode="text"
            />
            <Button className="w-full" disabled={createEntry.isPending || !parameterId} onClick={handleSave}>
              {createEntry.isPending ? t("common.saving") : t("dashboard.gratitudeSave")}
            </Button>
          </div>

          {recent.length === 0 && <EmptyState icon={Smile} title={t("dashboard.gratitudeEmpty")} className="py-4" />}
        </CardContent>
      </Card>

      {correlationData.length >= 2 && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              {t("dashboard.gratitudeRelationTitle")}
            </CardTitle>
            <p className="text-xs text-muted-foreground pt-1">{t("dashboard.gratitudeRelationHint")}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => setShowChart(!showChart)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card shadow-neumorphic-sm text-xs font-medium text-muted-foreground cursor-pointer hover:text-primary transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showChart ? t("dashboard.gratitudeHideChart") : t("dashboard.gratitudeShowChart")}
            </button>
            {showChart && (
              <CorrelationChart
                data={correlationData as unknown as Record<string, unknown>[]}
                lines={[
                  { dataKey: "gratitude", stroke: "hsl(var(--accent))", label: t("dashboard.gratitudeFrequency") },
                  { dataKey: "mood", stroke: "hsl(var(--primary))", label: t("dashboard.gratitudeMood") },
                ]}
                formatLabel={(name) => name === "gratitude" ? t("dashboard.gratitudeFrequency") : t("dashboard.gratitudeMood")}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard.gratitudeHistoryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {lastWeek.length === 0 ? (
            <EmptyState icon={Smile} title={t("dashboard.gratitudeHistoryEmpty")} className="py-4" />
          ) : (
            <ul className="space-y-2">
              {lastWeek.map((e) => (
                <li key={e.id} className="text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <p className="text-foreground">{e.note}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDateShort(e.createdAt, i18n.language)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
