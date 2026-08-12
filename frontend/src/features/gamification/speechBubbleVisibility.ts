import { useEffect, useState } from 'react';

const STORAGE_KEY = 'moodly_hide_speech_bubble';

type Listener = () => void;

let hidden = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
const listeners = new Set<Listener>();

export function isSpeechBubbleHidden(): boolean {
  return hidden;
}

export function setSpeechBubbleHidden(value: boolean) {
  hidden = value;
  if (value) {
    localStorage.setItem(STORAGE_KEY, '1');
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeSpeechBubbleVisibility(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSpeechBubbleHidden(): boolean {
  const [hiddenState, setHiddenState] = useState(isSpeechBubbleHidden);
  useEffect(
    () => subscribeSpeechBubbleVisibility(() => setHiddenState(isSpeechBubbleHidden())),
    [],
  );
  return hiddenState;
}
