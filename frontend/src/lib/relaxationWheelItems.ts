export interface RelaxationWheelCustomItem {
  key: string;
  label: string;
  createdAt: string;
}

const STORAGE_KEY = 'moodly_relaxation_wheel_items';

function readStorage(): RelaxationWheelCustomItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is RelaxationWheelCustomItem =>
        !!a && typeof a === 'object' && typeof a.key === 'string' && typeof a.label === 'string',
    );
  } catch {
    return [];
  }
}

function writeStorage(list: RelaxationWheelCustomItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage may be unavailable */
  }
}

export function loadRelaxationWheelItems(): RelaxationWheelCustomItem[] {
  return readStorage();
}

export function createRelaxationWheelItem(label: string): RelaxationWheelCustomItem {
  const key = `custom:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const item: RelaxationWheelCustomItem = { key, label, createdAt: new Date().toISOString() };
  writeStorage([...readStorage(), item]);
  return item;
}

export function removeRelaxationWheelItem(key: string) {
  writeStorage(readStorage().filter((a) => a.key !== key));
}
