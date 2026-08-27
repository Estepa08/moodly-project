import { useLowMoodDetection } from '../hooks/useLowMoodDetection';
import { useEvolutionMoment } from '../hooks/useEvolutionMoment';
import { useStreakMilestoneMoment } from '../hooks/useStreakMilestoneMoment';
import { useHiddenAchievementMoment } from '../hooks/useHiddenAchievementMoment';
import { useInterfaceMode } from '../hooks/useInterfaceMode';
import { LowMoodAlert } from '../features/dialogs';
import EvolutionMoment from '../features/gamification/EvolutionMoment';
import StreakMilestoneMoment from '../features/gamification/StreakMilestoneMoment';
import HiddenAchievementMoment from '../features/gamification/HiddenAchievementMoment';

export default function LayoutModals() {
  const { isClassic } = useInterfaceMode();
  const { detected: lowMoodDetected, acknowledge: dismissLowMood } = useLowMoodDetection();
  // Хуки продолжают следить за прогрессом (эволюция/вехи стрика/скрытые
  // ачивки) и в классическом режиме — это не сбрасывает состояние «уже
  // видели» в localStorage, просто в классическом режиме соответствующий
  // полноэкранный оверлей не открывается (isClassic ниже гасит `open`).
  const { transition: evolutionTransition, dismiss: dismissEvolution } = useEvolutionMoment();
  const { milestone: streakMilestone, dismiss: dismissStreakMilestone } =
    useStreakMilestoneMoment();
  const { achievement: hiddenAchievement, dismiss: dismissHiddenAchievement } =
    useHiddenAchievementMoment();

  return (
    <>
      <LowMoodAlert open={lowMoodDetected} onDismiss={dismissLowMood} />
      <EvolutionMoment
        open={!isClassic && evolutionTransition !== null}
        fromStage={evolutionTransition?.from ?? null}
        toStage={evolutionTransition?.to ?? null}
        onDismiss={dismissEvolution}
      />
      <StreakMilestoneMoment
        open={!isClassic && streakMilestone !== null}
        days={streakMilestone}
        onDismiss={dismissStreakMilestone}
      />
      <HiddenAchievementMoment
        open={!isClassic && hiddenAchievement !== null}
        achievement={hiddenAchievement}
        onDismiss={dismissHiddenAchievement}
      />
    </>
  );
}
