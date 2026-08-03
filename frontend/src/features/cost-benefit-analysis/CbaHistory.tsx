import { useTranslation } from "react-i18next";
import { Trash2, Scale } from "lucide-react";
import { ProgressBar } from "../../components/ui/progress-bar";
import { Card, CardContent } from "../../components/ui/card";
import { IconButton } from "../../components/ui/icon-button";
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
                  { value: entry.prosWeight, className: "bg-success" },
                  { value: entry.consWeight, className: "bg-destructive" },
                ]}
                className="flex-1 h-2"
                rounded={false}
              />
              <div className="text-xs text-right shrink-0">
                <p className="font-medium text-foreground">{entry.prosWeight}</p>
                <p className="text-muted-foreground text-[11px]">{entry.consWeight}</p>
              </div>
              <IconButton
                variant="ghost"
                size="icon-sm"
                label={t("cba.deleteEntry")}
                onClick={() => deleteEntry.mutate(entry.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 aria-hidden="true" className="w-4 h-4" />
              </IconButton>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
