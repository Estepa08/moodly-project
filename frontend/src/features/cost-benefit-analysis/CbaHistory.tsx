import { useTranslation } from "react-i18next";
import { Trash2, Scale } from "lucide-react";
import { ProgressBar } from "../../components/ui/progress-bar";
import { Card, CardContent } from "../../components/ui/card";
import EmptyState from "../../components/ui/empty-state";
import type { CbaEntry } from "./cba.types";
import type { useDeleteCbaEntry } from "./useCba";

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
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.id} className="shadow-neumorphic-sm">
          <CardContent className="py-3 space-y-2">
            <p className="text-sm font-medium text-foreground">{entry.thoughtText}</p>
            <div className="flex items-center gap-3">
              <ProgressBar
                segments={[
                  { value: entry.prosWeight, className: "bg-accent" },
                  { value: entry.consWeight, className: "bg-destructive" },
                ]}
                className="flex-1 h-2"
                rounded={false}
              />
              <div className="text-xs text-right shrink-0">
                <p className="font-medium text-foreground">{entry.prosWeight}</p>
                <p className="text-muted-foreground text-[10px]">{entry.consWeight}</p>
              </div>
              <button
                onClick={() => deleteEntry.mutate(entry.id)}
                aria-label={t("cba.deleteEntry")}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
