import { useTranslation } from "react-i18next";
import { Circle, CheckCircle2, Gift, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { useMissions, useClaimMission } from "./useCreature";
import { LoadingCard } from "../../components/ui/loading-card";

export default function DailyMissions() {
  const { t } = useTranslation();
  const { data: missions, isLoading } = useMissions();
  const claimMission = useClaimMission();

  if (isLoading) return <LoadingCard />;

  const allClaimed = missions?.every((m) => m.claimed) ?? false;

  return (
    <div className="space-y-2">
      {missions?.map((mission) => {
        const isComplete = mission.progress >= 1;
        return (
          <div
            key={mission.id}
            data-testid={`mission-${mission.missionKey}`}
            className={cn(
              "rounded-xl p-3 flex items-center gap-3 transition-[background-color,opacity] duration-150",
              mission.claimed ? "bg-muted/30 opacity-60" : "bg-card shadow-neumorphic-sm",
            )}
          >
            <div className="shrink-0">
              {mission.claimed ? (
                <CheckCircle2 aria-hidden="true" className="w-6 h-6 text-success" />
              ) : isComplete ? (
                <button
                  onClick={() => claimMission.mutate(mission.id)}
                  disabled={claimMission.isPending}
                  className="w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                  aria-label={t("missions.claim")}
                >
                  <Gift aria-hidden="true" className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
              ) : (
                <Circle aria-hidden="true" className="w-6 h-6 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  mission.claimed ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {t(mission.labelKey)}
              </p>
              <p className="text-xs text-muted-foreground">+{mission.xpReward} XP</p>
            </div>
            {!mission.claimed && (
              <div className="shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    isComplete ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {Math.round(mission.progress * 100)}%
                </div>
              </div>
            )}
          </div>
        );
      })}
      {allClaimed && missions && missions.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-accent font-medium py-2">
          <Sparkles aria-hidden="true" className="w-3.5 h-3.5" />
          {t("missions.allDone")}
        </div>
      )}
    </div>
  );
}
