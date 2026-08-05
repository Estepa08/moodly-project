import { exportDataKey, importDataKey } from "./keys";

/**
 * DEK (ключ данных) хранится в sessionStorage: переживает перезагрузку страницы
 * (важно для PWA), исчезает при закрытии вкладки и при logout.
 * В localStorage не пишется; на сервере хранится только wrappedKey (DEK, зашифрованный KEK).
 */

const SESSION_KEY = "moodly_data_key";
const SESSION_USER_ID = "moodly_user_id";

let cached: CryptoKey | null = null;
let cachedRaw: string | null = null;
let cachedUserId: string | null = null;

export function hasSessionKey(): boolean {
  return getSessionKeyRaw() !== null;
}

export function getSessionKeyRaw(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/** Возвращает DEK: из памяти или восстанавливает из sessionStorage. */
export async function getSessionKey(): Promise<CryptoKey> {
  const raw = getSessionKeyRaw();
  if (!raw) throw new Error("Data key is not unlocked");
  if (cached && cachedRaw === raw) return cached;
  const key = await importDataKey(raw);
  cached = key;
  cachedRaw = raw;
  return key;
}

export async function setSessionKey(key: CryptoKey): Promise<void> {
  const raw = await exportDataKey(key);
  cached = key;
  cachedRaw = raw;
  try {
    sessionStorage.setItem(SESSION_KEY, raw);
  } catch {
    // sessionStorage может быть недоступен (приватный режим) — работаем из памяти.
  }
}

export async function restoreSessionKey(base64: string): Promise<void> {
  const key = await importDataKey(base64);
  cached = key;
  cachedRaw = base64;
  try {
    sessionStorage.setItem(SESSION_KEY, base64);
  } catch {
    // noop
  }
}

export function clearSessionKey(): void {
  cached = null;
  cachedRaw = null;
  cachedUserId = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_USER_ID);
  } catch {
    // noop
  }
}

export function setSessionUserId(userId: string): void {
  cachedUserId = userId;
  try {
    sessionStorage.setItem(SESSION_USER_ID, userId);
  } catch {
    // noop
  }
}

export function getSessionUserId(): string | null {
  if (cachedUserId !== null) return cachedUserId;
  try {
    cachedUserId = sessionStorage.getItem(SESSION_USER_ID);
  } catch {
    cachedUserId = null;
  }
  return cachedUserId;
}
