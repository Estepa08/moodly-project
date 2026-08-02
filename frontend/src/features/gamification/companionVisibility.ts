const STORAGE_KEY = "moodly_hide_floating_companion";

type Listener = () => void;

let hidden = typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
const listeners = new Set<Listener>();

export function isCompanionHidden(): boolean {
  return hidden;
}

export function setCompanionHidden(value: boolean) {
  hidden = value;
  if (value) {
    localStorage.setItem(STORAGE_KEY, "1");
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCompanionVisibility(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
