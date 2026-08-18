import { useLowMoodDetection } from '../hooks/useLowMoodDetection';
import { useEvolutionMoment } from '../hooks/useEvolutionMoment';
import { LowMoodAlert } from '../features/dialogs';
import EvolutionMoment from '../features/gamification/EvolutionMoment';

export default function LayoutModals() {
  const { detected: lowMoodDetected, acknowledge: dismissLowMood } = useLowMoodDetection();
  const { transition: evolutionTransition, dismiss: dismissEvolution } = useEvolutionMoment();

  return (
    <>
      <LowMoodAlert open={lowMoodDetected} onDismiss={dismissLowMood} />
      <EvolutionMoment
        open={evolutionTransition !== null}
        fromStage={evolutionTransition?.from ?? null}
        toStage={evolutionTransition?.to ?? null}
        onDismiss={dismissEvolution}
      />
    </>
  );
}
