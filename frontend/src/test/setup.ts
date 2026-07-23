import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import i18n from "../i18n/i18n";

i18n.changeLanguage("en");

// Node ships its own built-in `localStorage` global (stable since Node 22),
// which can shadow jsdom's window.localStorage depending on pool/isolation
// settings — leading to "localStorage.setItem is not a function" failures
// that are order-dependent rather than a real bug in the code under test.
// Force a plain, working in-memory implementation so every test file gets
// consistent behavior regardless of run order.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

Object.defineProperty(globalThis, "localStorage", {
  value: createMemoryStorage(),
  writable: true,
  configurable: true,
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
