import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLowMoodDetection } from "../hooks/useLowMoodDetection";
import { useCreatureState } from "../features/gamification";
import { useDailyCheckIn } from "../features/check-in";
import { celebrate } from "../features/gamification";
import { LowMoodAlert } from "../features/dialogs";
import { DailyCheckInModal } from "../features/check-in";

export default function LayoutModals() {
  const { t } = useTranslation();
  const { detected: lowMoodDetected, acknowledge: dismissLowMood } = useLowMoodDetection();
  const { data: creature } = useCreatureState();
  const {
    shouldShow: showCheckIn,
    isPending: checkInPending,
    doCheckIn,
    dismiss: dismissCheckIn,
    lastResult,
  } = useDailyCheckIn(creature);

  useEffect(() => {
    if (lastResult?.leveledUp) {
      celebrate(
        t("dailyCheckIn.levelUpTitle"),
        t("dailyCheckIn.levelUpBody", { level: lastResult.state.level }),
      );
    }
  }, [lastResult, t]);

  return (
    <>
      <LowMoodAlert open={lowMoodDetected} onDismiss={dismissLowMood} />
      <DailyCheckInModal
        open={showCheckIn}
        onCheckIn={doCheckIn}
        onDismiss={dismissCheckIn}
        streak={creature?.streak ?? 0}
        isPending={checkInPending}
      />
    </>
  );
}
