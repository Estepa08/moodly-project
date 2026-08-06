import { useLowMoodDetection } from "../hooks/useLowMoodDetection";
import { LowMoodAlert } from "../features/dialogs";

export default function LayoutModals() {
  const { detected: lowMoodDetected, acknowledge: dismissLowMood } = useLowMoodDetection();

  return (
    <>
      <LowMoodAlert open={lowMoodDetected} onDismiss={dismissLowMood} />
    </>
  );
}
