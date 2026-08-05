import { toBase64, fromBase64, asBufferSource } from "./kdf";

const RAW_LENGTH = 32; // 256-битный ключ данных

const encoder = new TextEncoder();

/**
 * DEK — случайный ключ данных. extractable=true нужен, чтобы держать его
 * в памяти сессии и пере-шифровать при смене пароля.
 */
export async function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(RAW_LENGTH)),
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportDataKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return toBase64(new Uint8Array(raw));
}

export async function importDataKey(base64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", asBufferSource(fromBase64(base64)), "AES-GCM", true, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Заворачивает DEK ключом KEK (AES-GCM). Возвращает base64-строку
 * `iv(12) | ciphertext+tag`, которую можно хранить на сервере.
 */
export async function wrapDataKey(dataKey: CryptoKey, kek: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = await crypto.subtle.exportKey("raw", dataKey);
  const wrapped = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asBufferSource(iv) },
    kek,
    raw,
  );
  const buf = new Uint8Array(iv.length + wrapped.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(wrapped), iv.length);
  return toBase64(buf);
}

/** Разворачивает DEK из wrappedKey. */
export async function unwrapDataKey(wrappedKey: string, kek: CryptoKey): Promise<CryptoKey> {
  const buf = fromBase64(wrappedKey);
  const iv = buf.slice(0, 12);
  const wrapped = buf.slice(12);
  const raw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: asBufferSource(iv) },
    kek,
    asBufferSource(wrapped),
  );
  return crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
}

const RECOVERY_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Генерирует recovery-код: 5 групп по 4 символа, без неоднозначных букв. */
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let code = "";
  for (let i = 0; i < bytes.length; i++) {
    code += RECOVERY_CHARSET[bytes[i] % RECOVERY_CHARSET.length];
    if (code.length % 4 === 0 && code.length < 20) code += "-";
  }
  return code;
}
