import { DEFAULT_WHEEL_ITEM_KEYS } from './relaxationWheel';

export interface RelaxationWheel {
  id: string;
  name: string;
  itemKeys: string[];
}

const STORAGE_KEY = 'moodly_relaxation_wheels';
export const DEFAULT_WHEEL_ID = 'default';

function readStorage(): RelaxationWheel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is RelaxationWheel =>
        !!w &&
        typeof w === 'object' &&
        typeof w.id === 'string' &&
        typeof w.name === 'string' &&
        Array.isArray(w.itemKeys) &&
        w.itemKeys.every((k: unknown) => typeof k === 'string'),
    );
  } catch {
    return [];
  }
}

function writeStorage(list: RelaxationWheel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage may be unavailable */
  }
}

/** При первом обращении сеет дефолтное колесо с встроенным набором пунктов. */
export function loadWheels(defaultName: string): RelaxationWheel[] {
  const list = readStorage();
  if (list.length > 0) return list;
  const seeded: RelaxationWheel[] = [
    { id: DEFAULT_WHEEL_ID, name: defaultName, itemKeys: [...DEFAULT_WHEEL_ITEM_KEYS] },
  ];
  writeStorage(seeded);
  return seeded;
}

export function createWheel(name: string): RelaxationWheel {
  const wheel: RelaxationWheel = {
    id: `wheel:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    itemKeys: [],
  };
  writeStorage([...readStorage(), wheel]);
  return wheel;
}

export function renameWheel(id: string, name: string) {
  writeStorage(readStorage().map((w) => (w.id === id ? { ...w, name } : w)));
}

export function deleteWheel(id: string) {
  if (id === DEFAULT_WHEEL_ID) return;
  writeStorage(readStorage().filter((w) => w.id !== id));
}

export function addItemToWheel(wheelId: string, key: string) {
  writeStorage(
    readStorage().map((w) =>
      w.id === wheelId && !w.itemKeys.includes(key) ? { ...w, itemKeys: [...w.itemKeys, key] } : w,
    ),
  );
}

export function removeItemFromWheel(wheelId: string, key: string) {
  writeStorage(
    readStorage().map((w) =>
      w.id === wheelId ? { ...w, itemKeys: w.itemKeys.filter((k) => k !== key) } : w,
    ),
  );
}

/** Каскадная чистка: удаляет пункт из всех колёс сразу (при удалении из библиотеки). */
export function removeItemFromAllWheels(key: string) {
  writeStorage(readStorage().map((w) => ({ ...w, itemKeys: w.itemKeys.filter((k) => k !== key) })));
}
