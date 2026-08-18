import { useTranslation } from 'react-i18next';
import { useCreatureState, useCreatureStats } from './index';
import ProgressHero from './ProgressHero';
import CreatureStatsBlock from './CreatureStatsBlock';
import PetCollection from './PetCollection';
import AchievementGrid from './AchievementGrid';
import DailyMissions from './DailyMissions';
import WeeklyCalendar from './WeeklyCalendar';
import ActivityHeatmap from './ActivityHeatmap';
import { Trophy, Target, PawPrint, ListChecks, Activity, Medal, CalendarDays } from 'lucide-react';
import CollapsibleSection from '../../components/ui/collapsible-section';
import TitleSelector from './TitleSelector';
import { api } from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProgressPage() {
  const { t } = useTranslation();
  const { data: creature, isLoading: creatureLoading } = useCreatureState();
  const { data: stats, isLoading: statsLoading } = useCreatureStats();
  const queryClient = useQueryClient();

  const setTitle = useMutation({
    mutationFn: (title: string | null) => api.creature.setTitle(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creature'] });
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
          {t('progress.pageTitle')}
        </h2>
      </div>

      {creature && <ProgressHero creature={creature} />}

      {stats && (
        <CollapsibleSection
          title={t('progress.statsTitle')}
          subtitle={t('progress.statsSubtitle')}
          icon={Target}
          iconClassName="bg-primary/10 text-primary"
          railClassName="bg-primary/80"
          defaultOpen={false}
          storageKey="moodly_collapse_progress_stats"
        >
          <CreatureStatsBlock stats={stats} />
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title={t('progress.missionsTitle')}
        subtitle={t('progress.missionsSubtitle')}
        icon={ListChecks}
        iconClassName="bg-accent/10 text-accent"
        railClassName="bg-accent/80"
        defaultOpen={false}
        storageKey="moodly_collapse_progress_missions"
      >
        <DailyMissions />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('progress.weeklyTitle')}
        subtitle={t('progress.weeklySubtitle')}
        icon={CalendarDays}
        iconClassName="bg-success/10 text-success"
        railClassName="bg-success/80"
        defaultOpen={false}
        storageKey="moodly_collapse_progress_weekly"
      >
        <WeeklyCalendar />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('progress.petsTitle')}
        subtitle={t('progress.petsSubtitle')}
        icon={PawPrint}
        iconClassName="bg-pet-1/10 text-pet-1"
        railClassName="bg-pet-1/80"
        defaultOpen={false}
        storageKey="moodly_collapse_progress_pets"
      >
        <PetCollection />
      </CollapsibleSection>

      {creature && creature.unlockedTitles && creature.unlockedTitles.length > 0 && (
        <CollapsibleSection
          title={t('progress.titlesTitle')}
          subtitle={t('progress.titlesSubtitle')}
          icon={Medal}
          iconClassName="bg-info/10 text-info"
          railClassName="bg-info/80"
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
        title={t('progress.achievementsTitle')}
        subtitle={t('progress.achievementsSubtitle')}
        icon={Trophy}
        iconClassName="bg-warning/10 text-warning"
        railClassName="bg-warning/80"
        defaultOpen={false}
        storageKey="moodly_collapse_progress_achievements"
      >
        <AchievementGrid />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('progress.activityTitle')}
        subtitle={t('progress.activitySubtitle')}
        icon={Activity}
        iconClassName="bg-success/10 text-success"
        railClassName="bg-success/80"
        defaultOpen={false}
        storageKey="moodly_collapse_progress_activity"
      >
        <ActivityHeatmap />
      </CollapsibleSection>
    </div>
  );
}
