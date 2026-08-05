import { toBase64, fromBase64, asBufferSource } from "./kdf";

export const CRYPTO_VERSION = 1;

const IV_LENGTH = 12;
const encoder = new TextEncoder();

export interface EncryptContext {
  userId: string;
  entityId: string;
}

/**
 * Шифрует объект в base64: `version(1) | iv(12) | ciphertext+tag`.
 * AAD привязан к userId и id записи, чтобы нельзя было подменить шифротекст
 * между записями одного пользователя.
 */
export async function encryptJson(
  dataKey: CryptoKey,
  value: unknown,
  ctx: EncryptContext,
): Promise<string> {
  const aad = encoder.encode(`moodly:${ctx.userId}:${ctx.entityId}`);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const plaintext = encoder.encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asBufferSource(iv), additionalData: asBufferSource(aad) },
    dataKey,
    plaintext,
  );

  const buf = new Uint8Array(1 + IV_LENGTH + cipher.byteLength);
  buf.set([CRYPTO_VERSION], 0);
  buf.set(iv, 1);
  buf.set(new Uint8Array(cipher), 1 + IV_LENGTH);
  return toBase64(buf);
}

/** Обратная операция к encryptJson. Возвращает расшифрованный объект. */
export async function decryptJson(
  dataKey: CryptoKey,
  payload: string,
  ctx: EncryptContext,
): Promise<unknown> {
  const buf = fromBase64(payload);
  const version = buf[0];
  if (version !== CRYPTO_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }
  const iv = buf.slice(1, 1 + IV_LENGTH);
  const cipher = buf.slice(1 + IV_LENGTH);
  const aad = encoder.encode(`moodly:${ctx.userId}:${ctx.entityId}`);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: asBufferSource(iv), additionalData: asBufferSource(aad) },
    dataKey,
    asBufferSource(cipher),
  );
  const decoded = new TextDecoder().decode(plaintext);
  return JSON.parse(decoded);
}
