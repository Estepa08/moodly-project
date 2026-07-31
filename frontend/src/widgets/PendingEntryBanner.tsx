import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { useEntries } from "../hooks/useEntries";
import { QuickEntryIcons } from "../features/mood-entry";
import type { CreateEntryMutation } from "../lib/app-types";
import type { components } from "../lib/api-types";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface PendingEntryBannerProps {
  numericParams: components["schemas"]["Parameter"][] | undefined;
  createEntry: CreateEntryMutation;
}

export default function PendingEntryBanner({
  numericParams,
  createEntry,
}: PendingEntryBannerProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayEnd = useMemo(() => {
    const d = new Date(todayStart);
    d.setDate(d.getDate() + 1);
    return d;
  }, [todayStart]);

  const { data: todayEntries, isLoading } = useEntries({
    from: todayStart.toISOString(),
    to: todayEnd.toISOString(),
  });

  const coreParamIds = useMemo(
    () =>
      numericParams
        ?.filter((p) => ["Mood", "Energy", "Sleep", "Anxiety"].includes(p.name))
        .map((p) => p.id) ?? [],
    [numericParams],
  );

  const hasAllToday = useMemo(
    () =>
      coreParamIds.length > 0 &&
      coreParamIds.every((id) => todayEntries?.some((e) => e.parameterId === id)),
    [coreParamIds, todayEntries],
  );

  if (isLoading || hasAllToday) return null;

  return (
    <>
      <Card className="shadow-neumorphic border-l-4 border-l-accent">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
              aria-expanded={expanded}
            >
              <Sparkles aria-hidden="true" className="w-5 h-5 text-accent shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {t("dashboard.pendingEntry.title")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("dashboard.pendingEntry.subtitle")}
                </p>
              </div>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0"
            >
              {expanded ? t("dashboard.pendingEntry.collapse") : t("dashboard.pendingEntry.cta")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {expanded && (
        <QuickEntryIcons createEntry={createEntry} numericParams={numericParams} />
      )}
    </>
  );
}
