import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PetSpeechBubble, { usePetSpeech } from "./PetSpeechBubble";
import {
  isSpeechBubbleHidden,
  subscribeSpeechBubbleVisibility,
} from "./speechBubbleVisibility";

const HIDDEN_PATHS = ["/tests/", "/practices/breathing", "/onboarding"];

export default function FloatingSpeechBubble() {
  const location = useLocation();
  const [hidden, setHidden] = useState(isSpeechBubbleHidden);
  const speech = usePetSpeech();

  useEffect(() => subscribeSpeechBubbleVisibility(() => setHidden(isSpeechBubbleHidden())), []);

  if (hidden) return null;
  if (HIDDEN_PATHS.some((path) => location.pathname.startsWith(path))) return null;
  if (!speech.current) return null;

  return (
    <div className="fixed right-4 bottom-[calc(9.5rem+var(--sab))] md:right-6 md:bottom-[6.5rem] z-40 w-[15rem] max-w-[calc(100vw-2rem)]">
      <PetSpeechBubble current={speech.current} dismiss={speech.dismiss} className="w-full" />
    </div>
  );
}
