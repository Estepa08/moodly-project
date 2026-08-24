import { useLowMoodDetection } from '../hooks/useLowMoodDetection';
import { useEvolutionMoment } from '../hooks/useEvolutionMoment';
import { useStreakMilestoneMoment } from '../hooks/useStreakMilestoneMoment';
import { LowMoodAlert } from '../features/dialogs';
import EvolutionMoment from '../features/gamification/EvolutionMoment';
import StreakMilestoneMoment from '../features/gamification/StreakMilestoneMoment';

export default function LayoutModals() {
  const { detected: lowMoodDetected, acknowledge: dismissLowMood } = useLowMoodDetection();
  const { transition: evolutionTransition, dismiss: dismissEvolution } = useEvolutionMoment();
  const { milestone: streakMilestone, dismiss: dismissStreakMilestone } =
    useStreakMilestoneMoment();

  return (
    <>
      <LowMoodAlert open={lowMoodDetected} onDismiss={dismissLowMood} />
      <EvolutionMoment
        open={evolutionTransition !== null}
        fromStage={evolutionTransition?.from ?? null}
        toStage={evolutionTransition?.to ?? null}
        onDismiss={dismissEvolution}
      />
      <StreakMilestoneMoment
        open={streakMilestone !== null}
        days={streakMilestone}
        onDismiss={dismissStreakMilestone}
      />
    </>
  );
}
