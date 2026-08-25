import { safeLocalStorage } from './safeStorage';

/**
 * Общий CRUD-паттерн для «списка объектов в одном ключе localStorage»
 * (использовался с небольшими вариациями в myActivities.ts,
 * relaxationWheelItems.ts, relaxationWheels.ts): читаем, валидируем форму
 * элементов через type guard (мусор/чужая версия схемы — молча
 * отбрасывается), пишем обратно целиком.
 */
export function readStorageArray<T>(key: string, isItem: (value: unknown) => value is T): T[] {
  const raw = safeLocalStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isItem);
  } catch {
    return [];
  }
}

export function writeStorageArray<T>(key: string, list: T[]): void {
  safeLocalStorage.setJSON(key, list);
}
