import { useTranslation } from "react-i18next";
import { Trash2, Scale } from "lucide-react";
import type { components } from "../lib/api-types";
import { ProgressBar } from "./ui/progress-bar";
import { Card, CardContent } from "./ui/card";
import EmptyState from "./ui/empty-state";
import type { useDeleteCbaEntry } from "../hooks/useCba";

type CbaEntry = components["schemas"]["CbaEntry"];

interface CbaHistoryProps {
  entries: CbaEntry[];
  deleteEntry: ReturnType<typeof useDeleteCbaEntry>;
}

export default function CbaHistory({ entries, deleteEntry }: CbaHistoryProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState icon={Scale} title={t("cba.historyEmpty")} />;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="shadow-neumorphic-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-foreground flex-1">{entry.thoughtText}</p>
              <button
                onClick={() => deleteEntry.mutate(entry.id)}
                aria-label={t("cba.deleteEntry")}
                className="text-muted-foreground hover:text-destructive transition-colors duration-150 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-accent w-8">{entry.prosWeight}</span>
              <ProgressBar
                segments={[
                  { value: entry.prosWeight, className: "bg-accent" },
                  { value: entry.consWeight, className: "bg-destructive" },
                ]}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-destructive w-8 text-right">
                {entry.consWeight}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {new Date(entry.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
