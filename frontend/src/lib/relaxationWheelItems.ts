import { readStorageArray, writeStorageArray } from './localStorageArray';

export interface RelaxationWheelCustomItem {
  key: string;
  label: string;
  createdAt: string;
}

const STORAGE_KEY = 'moodly_relaxation_wheel_items';

function isRelaxationWheelCustomItem(a: unknown): a is RelaxationWheelCustomItem {
  return (
    !!a &&
    typeof a === 'object' &&
    typeof (a as RelaxationWheelCustomItem).key === 'string' &&
    typeof (a as RelaxationWheelCustomItem).label === 'string'
  );
}

function readStorage(): RelaxationWheelCustomItem[] {
  return readStorageArray(STORAGE_KEY, isRelaxationWheelCustomItem);
}

function writeStorage(list: RelaxationWheelCustomItem[]) {
  writeStorageArray(STORAGE_KEY, list);
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
