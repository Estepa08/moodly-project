import { useTranslation } from "react-i18next";
import { Wind, Heart, Moon, Brain, Scale, Sparkles } from "lucide-react";
import { useCompletions } from "../hooks/useCreature";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import EmptyState from "./ui/empty-state";
import Spinner from "./ui/spinner";

interface PracticeProgressProps {
  breathingSessionCount?: number;
}

const SOURCE_CONFIG: Record<string, { icon: typeof Wind; labelKey: string }> = {
  breathing: { icon: Wind, labelKey: "progress.activityBreathing" },
  gratitude: { icon: Heart, labelKey: "progress.activityGratitude" },
  sleepHygiene: { icon: Moon, labelKey: "progress.activitySleepHygiene" },
  distortions: { icon: Brain, labelKey: "progress.activityDistortions" },
  cba: { icon: Scale, labelKey: "progress.activityCba" },
};

const ALL_SOURCES = ["breathing", "gratitude", "sleepHygiene", "distortions", "cba"];

export default function PracticeProgress({ breathingSessionCount }: PracticeProgressProps) {
  const { t } = useTranslation();
  const { data: completions, isLoading } = useCompletions(30);

  if (isLoading) {
    return (
      <Card className="shadow-neumorphic">
        <CardContent className="flex justify-center py-8">
          <Spinner size={32} />
        </CardContent>
      </Card>
    );
  }

  const bySource: Record<string, { count: number; xp: number }> = {};
  for (const c of completions ?? []) {
    if (!bySource[c.source]) bySource[c.source] = { count: 0, xp: 0 };
    bySource[c.source].count += 1;
    bySource[c.source].xp += c.xpAwarded;
  }

  if (breathingSessionCount !== undefined && bySource.breathing) {
    bySource.breathing.count = Math.max(bySource.breathing.count, breathingSessionCount);
  }

  const totalXp = Object.values(bySource).reduce((sum, s) => sum + s.xp, 0);
  const hasAnyData = Object.keys(bySource).length > 0;
  const recent = completions ? completions.slice(0, 10) : [];

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("progress.completionsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
          {ALL_SOURCES.map((source) => {
            const config = SOURCE_CONFIG[source];
            const data = bySource[source];
            const Icon = config.icon;
            if (!data) {
              return (
                <div key={source} className="rounded-xl bg-muted/50 p-3 flex items-center gap-3 max-sm:p-2 opacity-50">
                  <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{t(config.labelKey)}</p>
                    <p className="text-sm font-semibold text-muted-foreground truncate">—</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={source} className="rounded-xl bg-muted/50 p-3 flex items-center gap-3 max-sm:p-2">
                <Icon className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{t(config.labelKey)}</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {t("progress.totalCompletions", { count: data.count })} · +{data.xp} XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {hasAnyData && (
          <>
            <div className="text-center text-xs text-muted-foreground font-medium pt-1 border-t border-border">
              {t("progress.completionsTotal", { xp: totalXp })}
            </div>

            {recent.length > 0 && (
              <div className="border-t border-border pt-3 mt-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t("progress.recentActivity")}
                </p>
                <div className="space-y-1.5">
                  {recent.map((c, idx) => {
                    const config = SOURCE_CONFIG[c.source];
                    const date = new Date(c.createdAt);
                    const dateStr = date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                    return (
                      <div
                        key={`${c.createdAt}-${idx}`}
                        className="flex items-center justify-between text-xs text-muted-foreground"
                      >
                        <span className="flex items-center gap-1.5">
                          {config && <config.icon className="w-3 h-3" />}
                          {config ? t(config.labelKey) : c.source}
                        </span>
                        <span className="tabular-nums">
                          +{c.xpAwarded} XP · {dateStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {!hasAnyData && (
          <EmptyState icon={Sparkles} title={t("progress.noData")} />
        )}
      </CardContent>
    </Card>
  );
}
