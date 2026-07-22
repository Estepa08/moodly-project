import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "../lib/api-types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Entry = components["schemas"]["Entry"];

interface GratitudeJournalProps {
  parameterId: string | undefined;
  entries: Entry[];
  createEntry: UseMutationResult<Entry, Error, { parameterId: string; value: number; note?: string }, unknown>;
  limit?: number;
  hideTitle?: boolean;
}

export default function GratitudeJournal({ parameterId, entries, createEntry, limit = 5, hideTitle = false }: GratitudeJournalProps) {
  const { t, i18n } = useTranslation();
  const [note, setNote] = useState("");

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
          toast.success(t("dashboard.gratitudeSaved"));
        },
      },
    );
  };

  const recent = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return (
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
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("dashboard.gratitudePlaceholder")}
            rows={2}
            className="flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-neumorphic-inset transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <Button
            className="w-full"
            disabled={createEntry.isPending || !parameterId}
            onClick={handleSave}
          >
            {createEntry.isPending ? t("common.saving") : t("dashboard.gratitudeSave")}
          </Button>
        </div>

        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">{t("dashboard.gratitudeEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <li key={e.id} className="text-sm bg-muted/30 rounded-lg px-3 py-2">
                <p className="text-foreground">{e.note}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(e.createdAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
