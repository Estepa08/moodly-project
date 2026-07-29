import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Moon, Pencil, ChevronDown, X, Bed, Check } from "lucide-react";
import type { CreateEntryMutation, UpdateEntryMutation } from "../../lib/app-types";
import type { components } from "../../lib/api-types";
import { SLEEP_HYGIENE_ITEMS, dayKey, parseCheckedNote, findTodayEntry } from "../../lib/sleepHygiene";
import { ChecklistItem } from "../../components/ui/checklist-item";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";
import { Button } from "../../components/ui/button";
import { cn, formatDateShort } from "../../lib/utils";
import SleepHygieneChart from "./SleepHygieneChart";

interface SleepHygieneChecklistProps {
  parameterId: string | undefined;
  hygieneEntries: components["schemas"]["Entry"][];
  sleepEntries: components["schemas"]["Entry"][];
  createEntry: CreateEntryMutation;
  updateEntry: UpdateEntryMutation;
}

export default function SleepHygieneChecklist({
  parameterId,
  hygieneEntries,
  sleepEntries,
  createEntry,
  updateEntry,
}: SleepHygieneChecklistProps) {
  const { t, i18n } = useTranslation();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [listState, setListState] = useState<"checklist" | "completed">("checklist");
  const [todayEntryId, setTodayEntryId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const isPending = createEntry.isPending || updateEntry.isPending;

  useEffect(() => {
    const today = findTodayEntry(hygieneEntries);
    if (today) {
      setTodayEntryId(today.id);
      setChecked(parseCheckedNote(today.note));
      setListState("completed");
    }
  }, [hygieneEntries]);

  const toggleItem = (key: string) => {
    if (listState === "completed" && !isEditing) return;
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
          setListState("completed");
          setShowDetails(false);
          setIsEditing(false);
          toast.success(t("sleepHygiene.saved"));
        },
      },
    );
  };

  const handleStartEdit = () => {
    const today = findTodayEntry(hygieneEntries);
    if (today) {
      setChecked(parseCheckedNote(today.note));
      setTodayEntryId(today.id);
    }
    setIsEditing(true);
    setShowDetails(true);
  };

  const handleCancelEdit = () => {
    const today = findTodayEntry(hygieneEntries);
    if (today) setChecked(parseCheckedNote(today.note));
    setIsEditing(false);
    setShowDetails(false);
  };

  const handleUpdate = () => {
    if (!todayEntryId) return;
    updateEntry.mutate(
      { id: todayEntryId, value: checked.size, note: Array.from(checked).join(",") },
      {
        onSuccess: () => {
          setIsEditing(false);
          setShowDetails(false);
          toast.success(t("sleepHygiene.saved"));
        },
      },
    );
  };

  const recent = [...hygieneEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 7);

  const correlationData = useMemo(() => {
    const byDay = new Map<string, { habits?: number; sleep?: number }>();
    for (const e of hygieneEntries) {
      const key = dayKey(new Date(e.createdAt));
      if (!byDay.has(key)) byDay.set(key, {});
      byDay.get(key)!.habits = e.value;
    }
    for (const e of sleepEntries) {
      const key = dayKey(new Date(e.createdAt));
      if (!byDay.has(key)) byDay.set(key, {});
      byDay.get(key)!.sleep = e.value;
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: formatDateShort(date, i18n.language),
        habits: values.habits !== undefined ? Number(((values.habits / SLEEP_HYGIENE_ITEMS.length) * 10).toFixed(1)) : undefined,
        sleep: values.sleep,
      }));
  }, [hygieneEntries, sleepEntries, i18n.language]);

  return (
    <div className="space-y-4">
      {listState === "checklist" ? (
        <Card className="shadow-neumorphic">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-4 h-4 text-accent" />
              {t("sleepHygiene.checklistTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {SLEEP_HYGIENE_ITEMS.map((key) => (
                <ChecklistItem key={key} checked={checked.has(key)} onToggle={() => toggleItem(key)} label={t(`sleepHygiene.items.${key}`)} />
              ))}
            </div>
            <Button className="w-full" disabled={isPending || !parameterId} onClick={handleSave}>
              {isPending ? t("common.saving") : t("sleepHygiene.save")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-neumorphic">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-accent" />
              </div>
              <p className="text-base font-semibold text-foreground font-serif">{t("sleepHygiene.completed")}</p>
              <p className="text-sm text-muted-foreground">{t("sleepHygiene.completedItems", { count: checked.size, total: SLEEP_HYGIENE_ITEMS.length })}</p>
            </div>

            <div className={cn("overflow-hidden transition-all duration-300", showDetails ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0")}>
              <div className="space-y-2 pt-4 border-t border-border">
                {SLEEP_HYGIENE_ITEMS.map((key) => {
                  const isChecked = checked.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleItem(key)}
                      disabled={!isEditing}
                      aria-pressed={isChecked}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isEditing && "cursor-pointer active:scale-[0.99]",
                        isChecked ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                        isEditing && isChecked && "shadow-neumorphic-inset",
                      )}
                    >
                      <span className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0", isChecked ? "bg-accent border-accent" : "border-border", isEditing && isChecked && "bg-primary border-primary")}>
                        {isChecked && <Check className={cn("w-3.5 h-3.5", isEditing ? "text-primary-foreground" : "text-white")} />}
                      </span>
                      {t(`sleepHygiene.items.${key}`)}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-4">
                {isEditing ? (
                  <>
                    <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>{t("common.cancel")}</Button>
                    <Button className="flex-1" disabled={isPending || !todayEntryId} onClick={handleUpdate}>
                      {isPending ? t("common.saving") : t("sleepHygiene.saveEdit")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="flex-1" onClick={handleStartEdit}>
                      <Pencil className="w-4 h-4 mr-1.5" />{t("sleepHygiene.viewEdit")}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)} aria-label={t("common.close")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {!showDetails && (
              <div className="flex justify-center pt-4">
                <Button variant="ghost" onClick={() => setShowDetails(true)} className="flex items-center gap-1">
                  {t("sleepHygiene.viewEdit")}<ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SleepHygieneChart data={correlationData} />

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base">{t("sleepHygiene.historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState icon={Bed} title={t("sleepHygiene.empty")} className="py-4" />
          ) : (
            <ul className="space-y-2">
              {recent.map((e) => {
                const isExpanded = expandedEntryId === e.id;
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => setExpandedEntryId(isExpanded ? null : e.id)}
                      className="w-full flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2 transition-all duration-150 cursor-pointer hover:bg-muted/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="text-foreground">{formatDateShort(e.createdAt, i18n.language)}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        {e.value}/{SLEEP_HYGIENE_ITEMS.length}
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                      </span>
                    </button>
                    <div className={cn("overflow-hidden transition-all duration-300", isExpanded ? "max-h-[400px] opacity-100 mt-2" : "max-h-0 opacity-0")}>
                      <div className="space-y-1.5 pl-2 pr-2 pb-2">
                        {SLEEP_HYGIENE_ITEMS.map((key) => {
                          const done = parseCheckedNote(e.note).has(key);
                          return (
                            <div key={key} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl text-sm", done ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground")}>
                              <span className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0", done ? "bg-accent border-accent" : "border-border")}>
                                {done && <Check className="w-3.5 h-3.5 text-white" />}
                              </span>
                              <span>{t(`sleepHygiene.items.${key}`)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
