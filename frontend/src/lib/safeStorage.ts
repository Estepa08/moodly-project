/**
 * Тонкая обёртка над Web Storage (localStorage/sessionStorage), которая
 * никогда не бросает исключение наружу. Storage может кинуть в приватном
 * режиме браузера, при заполненной квоте или когда доступ к storage запрещён
 * политиками — во всех этих случаях мы хотим тихо деградировать, а не ронять
 * рендер/логику.
 */
export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** JSON.parse обёртки над getItem — сама попытка parse тоже не бросает. */
  getJSON<T>(key: string): T | null;
  /** JSON.stringify + setItem. */
  setJSON<T>(key: string, value: T): void;
}

function makeSafeStorage(getStorage: () => Storage): SafeStorage {
  return {
    getItem(key) {
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        getStorage().setItem(key, value);
      } catch {
        /* storage may be unavailable (private browsing, quota, disabled) */
      }
    },
    removeItem(key) {
      try {
        getStorage().removeItem(key);
      } catch {
        /* storage may be unavailable */
      }
    },
    getJSON<T>(key: string): T | null {
      const raw = this.getItem(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    setJSON<T>(key: string, value: T): void {
      try {
        this.setItem(key, JSON.stringify(value));
      } catch {
        /* value may not be serializable */
      }
    },
  };
}

export const safeLocalStorage: SafeStorage = makeSafeStorage(() => localStorage);
export const safeSessionStorage: SafeStorage = makeSafeStorage(() => sessionStorage);
