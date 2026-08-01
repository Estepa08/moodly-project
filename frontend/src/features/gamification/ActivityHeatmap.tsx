import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import { useHeatmap } from "./useCreature";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getColor(count: number, max: number): string {
  if (count === 0) return "bg-muted/30";
  const intensity = count / Math.max(max, 1);
  if (intensity > 0.75) return "bg-primary";
  if (intensity > 0.5) return "bg-primary/70";
  if (intensity > 0.25) return "bg-primary/40";
  return "bg-primary/20";
}

export default function ActivityHeatmap({ days = 90 }: { days?: number }) {
  const { t } = useTranslation();
  const { data: heatmap, isLoading } = useHeatmap(days);

  if (isLoading) {
    return <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />;
  }

  if (!heatmap || heatmap.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        {t("progress.noActivityYet")}
      </div>
    );
  }

  const maxCount = Math.max(...heatmap.map((d) => d.count), 1);
  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];

  for (const entry of heatmap) {
    const dayOfWeek = new Date(entry.date).getDay();
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(entry);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);
  if (weeks.length > 0) {
    const firstWeek = weeks[0];
    while (firstWeek.length < 7) {
      firstWeek.unshift({ date: "", count: -1 });
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 min-w-fit">
        <div className="flex flex-col gap-0.5 pr-1 justify-end">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[10px] text-[10px] text-muted-foreground leading-[10px]">
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }).map((_, di) => {
              const entry = week[di];
              if (!entry || entry.date === "") {
                return <div key={di} className="w-[10px] h-[10px]" />;
              }
              return (
                <div
                  key={entry.date}
                  className={cn("w-[10px] h-[10px] rounded-sm", getColor(entry.count, maxCount))}
                  title={`${entry.date}: ${entry.count} activities`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-muted-foreground">{t("progress.less")}</span>
        <div className="w-[10px] h-[10px] rounded-sm bg-muted/30" />
        <div className="w-[10px] h-[10px] rounded-sm bg-primary/20" />
        <div className="w-[10px] h-[10px] rounded-sm bg-primary/40" />
        <div className="w-[10px] h-[10px] rounded-sm bg-primary/70" />
        <div className="w-[10px] h-[10px] rounded-sm bg-primary" />
        <span className="text-[10px] text-muted-foreground">{t("progress.more")}</span>
      </div>
    </div>
  );
}
