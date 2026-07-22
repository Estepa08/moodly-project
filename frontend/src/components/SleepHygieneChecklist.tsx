import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Moon } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "../lib/api-types";
import { SLEEP_HYGIENE_ITEMS, SLEEP_HYGIENE_THRESHOLD, dayKey, nextDayKey } from "../lib/sleepHygiene";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type Entry = components["schemas"]["Entry"];

interface SleepHygieneChecklistProps {
  parameterId: string | undefined;
  hygieneEntries: Entry[];
  sleepEntries: Entry[];
  createEntry: UseMutationResult<Entry, Error, { parameterId: string; value: number; note?: string }, unknown>;
}

export default function SleepHygieneChecklist({
  parameterId,
  hygieneEntries,
  sleepEntries,
  createEntry,
}: SleepHygieneChecklistProps) {
  const { t, i18n } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    if (!parameterId) return;
    createEntry.mutate(
      { parameterId, value: checked.size, note: Array.from(checked).join(",") },
      {
        onSuccess: () => {
          setChecked(new Set());
          toast.success(t("sleepHygiene.saved"));
        },
      },
    );
  };

  const recent = [...hygieneEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  const comparison = useMemo(() => {
    const sleepByDay = new Map<string, number[]>();
    for (const e of sleepEntries) {
      const key = dayKey(new Date(e.createdAt));
      if (!sleepByDay.has(key)) sleepByDay.set(key, []);
      sleepByDay.get(key)!.push(e.value);
    }

    const highGroup: number[] = [];
    const lowGroup: number[] = [];
    for (const e of hygieneEntries) {
      const nextKey = nextDayKey(new Date(e.createdAt));
      const nextSleepValues = sleepByDay.get(nextKey);
      if (!nextSleepValues || nextSleepValues.length === 0) continue;
      const avgNextSleep = nextSleepValues.reduce((s, v) => s + v, 0) / nextSleepValues.length;
      if (e.value >= SLEEP_HYGIENE_THRESHOLD) highGroup.push(avgNextSleep);
      else lowGroup.push(avgNextSleep);
    }

    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);
    return { high: avg(highGroup), low: avg(lowGroup), highCount: highGroup.length, lowCount: lowGroup.length };
  }, [hygieneEntries, sleepEntries]);

  return (
    <div className="space-y-4">
      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4 text-accent" />
            {t("sleepHygiene.checklistTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {SLEEP_HYGIENE_ITEMS.map((key) => {
              const isChecked = checked.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleItem(key)}
                  aria-pressed={isChecked}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isChecked
                      ? "bg-primary/10 text-primary shadow-neumorphic-inset"
                      : "bg-muted text-muted-foreground shadow-neumorphic-sm",
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0",
                      isChecked ? "bg-primary border-primary" : "border-border",
                    )}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </span>
                  {t(`sleepHygiene.items.${key}`)}
                </button>
              );
            })}
          </div>

          <Button className="w-full" disabled={createEntry.isPending || !parameterId} onClick={handleSave}>
            {createEntry.isPending ? t("common.saving") : t("sleepHygiene.save")}
          </Button>
        </CardContent>
      </Card>

      {(comparison.high !== null || comparison.low !== null) && (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base">{t("sleepHygiene.comparisonTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t("sleepHygiene.moreHabits")}</p>
              <p className="text-xl font-bold text-primary font-serif">
                {comparison.high !== null ? comparison.high.toFixed(1) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t("sleepHygiene.fewerHabits")}</p>
              <p className="text-xl font-bold text-muted-foreground font-serif">
                {comparison.low !== null ? comparison.low.toFixed(1) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("sleepHygiene.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">{t("sleepHygiene.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-foreground">
                    {new Date(e.createdAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-muted-foreground">
                    {e.value}/{SLEEP_HYGIENE_ITEMS.length}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
