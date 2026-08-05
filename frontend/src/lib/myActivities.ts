export interface MyActivity {
  key: string;
  label: string;
  createdAt: string;
}

const STORAGE_KEY = "moodly_my_activities";

function readStorage(): MyActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is MyActivity =>
        !!a && typeof a === "object" && typeof a.key === "string" && typeof a.label === "string",
    );
  } catch {
    return [];
  }
}

function writeStorage(list: MyActivity[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage may be unavailable */
  }
}

export function loadMyActivities(): MyActivity[] {
  return readStorage();
}

export function createMyActivity(label: string): MyActivity {
  const key = `custom:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const item: MyActivity = { key, label, createdAt: new Date().toISOString() };
  const list = [...readStorage(), item];
  writeStorage(list);
  return item;
}

export function removeMyActivity(key: string) {
  writeStorage(readStorage().filter((a) => a.key !== key));
}

export function isKnownMyActivity(key: string): boolean {
  return readStorage().some((a) => a.key === key);
}
