import { useTranslation } from "react-i18next";
import { useCreatureState, useCreatureStats } from "./index";
import ProgressHero from "./ProgressHero";
import CreatureStatsBlock from "./CreatureStatsBlock";
import PetCollection from "./PetCollection";
import AchievementGrid from "./AchievementGrid";
import DailyMissions from "./DailyMissions";
import ActivityHeatmap from "./ActivityHeatmap";
import { Trophy, Target, PawPrint, ListChecks, Activity, Medal } from "lucide-react";
import CollapsibleSection from "../../components/ui/collapsible-section";
import TitleSelector from "./TitleSelector";
import { api } from "../../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProgressPage() {
  const { t } = useTranslation();
  const { data: creature, isLoading: creatureLoading } = useCreatureState();
  const { data: stats, isLoading: statsLoading } = useCreatureStats();
  const queryClient = useQueryClient();

  const setTitle = useMutation({
    mutationFn: (title: string | null) => api.creature.setTitle(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creature"] });
    },
  });

  if (creatureLoading || statsLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-muted/50" />
        <div className="h-32 rounded-xl bg-muted/50" />
        <div className="h-48 rounded-xl bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy aria-hidden="true" className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground font-serif">
          {t("progress.pageTitle")}
        </h2>
      </div>

      {creature && <ProgressHero creature={creature} />}

      {stats && (
        <CollapsibleSection
          title={t("progress.statsTitle")}
          icon={Target}
          defaultOpen
          storageKey="moodly_collapse_progress_stats"
        >
          <CreatureStatsBlock stats={stats} />
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title={t("progress.missionsTitle")}
        icon={ListChecks}
        defaultOpen
        storageKey="moodly_collapse_progress_missions"
      >
        <DailyMissions />
      </CollapsibleSection>

      <CollapsibleSection
        title={t("progress.petsTitle")}
        icon={PawPrint}
        defaultOpen
        storageKey="moodly_collapse_progress_pets"
      >
        <PetCollection />
      </CollapsibleSection>

      {creature && creature.unlockedTitles && creature.unlockedTitles.length > 0 && (
        <CollapsibleSection
          title={t("progress.titlesTitle")}
          icon={Medal}
          defaultOpen={false}
          storageKey="moodly_collapse_progress_titles"
        >
          <TitleSelector
            titles={creature.unlockedTitles}
            activeTitle={creature.activeTitle ?? null}
            onSelect={(title) => setTitle.mutate(title)}
          />
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title={t("progress.achievementsTitle")}
        icon={Trophy}
        defaultOpen
        storageKey="moodly_collapse_progress_achievements"
      >
        <AchievementGrid />
      </CollapsibleSection>

      <CollapsibleSection
        title={t("progress.activityTitle")}
        icon={Activity}
        defaultOpen={false}
        storageKey="moodly_collapse_progress_activity"
      >
        <ActivityHeatmap />
      </CollapsibleSection>
    </div>
  );
}
