import { readStorageArray, writeStorageArray } from './localStorageArray';

export interface MyActivity {
  key: string;
  label: string;
  createdAt: string;
}

const STORAGE_KEY = 'moodly_my_activities';

function isMyActivity(a: unknown): a is MyActivity {
  return (
    !!a &&
    typeof a === 'object' &&
    typeof (a as MyActivity).key === 'string' &&
    typeof (a as MyActivity).label === 'string'
  );
}

function readStorage(): MyActivity[] {
  return readStorageArray(STORAGE_KEY, isMyActivity);
}

function writeStorage(list: MyActivity[]) {
  writeStorageArray(STORAGE_KEY, list);
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
