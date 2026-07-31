import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Moon, Pencil, ChevronDown, X, Bed, Check } from "lucide-react";
import type { CreateEntryMutation, UpdateEntryMutation } from "../../lib/app-types";
import type { components } from "../../lib/api-types";
import {
  SLEEP_HYGIENE_ITEMS,
  parseCheckedNote,
  findTodayEntry,
  HygieneItem,
} from "../../lib/sleepHygiene";
import { SleepHygieneListState } from "../../lib/constants";
import { ChecklistItem } from "../../components/ui/checklist-item";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";
import { Button } from "../../components/ui/button";
import { cn, formatDateShort } from "../../lib/utils";

interface SleepHygieneChecklistProps {
  parameterId: string | undefined;
  hygieneEntries: components["schemas"]["Entry"][];
  createEntry: CreateEntryMutation;
  updateEntry: UpdateEntryMutation;
}

export default function SleepHygieneChecklist({
  parameterId,
  hygieneEntries,
  createEntry,
  updateEntry,
}: SleepHygieneChecklistProps) {
  const { t, i18n } = useTranslation();
  const [checked, setChecked] = useState<Set<HygieneItem>>(new Set());
  const [listState, setListState] = useState<SleepHygieneListState>(
    SleepHygieneListState.Checklist,
  );
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
      setListState(SleepHygieneListState.Completed);
    }
  }, [hygieneEntries]);

  const toggleItem = (key: HygieneItem) => {
    if (listState === SleepHygieneListState.Completed && !isEditing) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    const note = Array.from(checked).join(",");
    const value = checked.size;
    if (todayEntryId) {
      updateEntry.mutate(
        { id: todayEntryId, value, note },
        {
          onSuccess: () => {
            toast.success(t("sleepHygiene.saved"));
            setIsEditing(false);
            setListState(SleepHygieneListState.Completed);
          },
        },
      );
    } else {
      createEntry.mutate(
        { parameterId: parameterId!, value, note },
        {
          onSuccess: () => {
            toast.success(t("sleepHygiene.saved"));
            setListState(SleepHygieneListState.Completed);
          },
        },
      );
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setListState(SleepHygieneListState.Checklist);
  };

  const todayData = useMemo(() => {
    const today = findTodayEntry(hygieneEntries);
    if (!today) return null;
    return {
      id: today.id,
      checked: parseCheckedNote(today.note),
      date: formatDateShort(new Date(today.createdAt), i18n.language),
      value: today.value,
    };
  }, [hygieneEntries, i18n.language]);

  return (
    <div className="space-y-4">
      <Card className="shadow-neumorphic">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon aria-hidden="true" className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">{t("sleepHygiene.checklistTitle")}</CardTitle>
          </div>
          {listState === SleepHygieneListState.Completed && todayEntryId && (
            <Button size="sm" variant="ghost" onClick={handleEdit}>
              <Pencil aria-hidden="true" className="w-3.5 h-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {listState === SleepHygieneListState.Checklist && (
            <>
              <div className="space-y-2">
                {SLEEP_HYGIENE_ITEMS.map((item) => (
                  <ChecklistItem
                    key={item}
                    checked={checked.has(item)}
                    onToggle={() => toggleItem(item)}
                    label={t(`sleepHygiene.items.${item}`)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isPending || checked.size === 0}>
                  {t(isPending ? "common.saving" : "sleepHygiene.save")}
                </Button>
                {isEditing && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setListState(SleepHygieneListState.Completed);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
              </div>
            </>
          )}
          {listState === SleepHygieneListState.Completed && (
            <>
              {todayData ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                  <Check aria-hidden="true" className="w-6 h-6 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t("sleepHygiene.todayCompleted", { count: todayData.checked.size })}
                    </p>
                    <p className="text-xs text-muted-foreground">{todayData.date}</p>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Bed} title={t("sleepHygiene.noEntryYet")} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Button
        variant="link"
        size="sm"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full h-auto px-0 gap-1 text-muted-foreground hover:text-foreground"
      >
        {t(showDetails ? "sleepHygiene.hideHistory" : "sleepHygiene.showHistory")}
        <ChevronDown
          aria-hidden="true"
          className={cn("transition-transform", showDetails && "rotate-180")}
        />
      </Button>

      {showDetails &&
        hygieneEntries
          .filter((e) => e.id !== todayEntryId)
          .slice()
          .reverse()
          .map((entry) => {
            const entryChecked = parseCheckedNote(entry.note);
            return (
              <Card key={entry.id} className="shadow-neumorphic-sm">
                <CardContent className="pt-3 pb-3">
                  <button
                    onClick={() =>
                      setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)
                    }
                    className="w-full flex items-center justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2">
                      <Moon aria-hidden="true" className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {formatDateShort(new Date(entry.createdAt), i18n.language)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({entryChecked.size}/{SLEEP_HYGIENE_ITEMS.length})
                      </span>
                    </div>
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        expandedEntryId === entry.id && "rotate-180",
                      )}
                    />
                  </button>
                  {expandedEntryId === entry.id && (
                    <div className="mt-3 space-y-1">
                      {SLEEP_HYGIENE_ITEMS.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs">
                          {entryChecked.has(item) ? (
                            <Check aria-hidden="true" className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <X aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span
                            className={
                              entryChecked.has(item) ? "text-foreground" : "text-muted-foreground"
                            }
                          >
                            {t(`sleepHygiene.items.${item}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
}
