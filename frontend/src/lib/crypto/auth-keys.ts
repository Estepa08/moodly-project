import { deriveKek, generateSalt, fromBase64, toBase64 } from './kdf';
import { generateDataKey, wrapDataKey, unwrapDataKey } from './keys';
import { setSessionKey } from './session';

export interface RegistrationKeys {
  wrappedKey: string;
  keySalt: string;
  recoveryWrappedKey: string;
  recoverySalt: string;
}

export interface PasswordWrappedKey {
  wrappedKey: string;
  keySalt: string;
}

/**
 * Регистрация: генерируем DEK, заворачиваем его KEK (из пароля) и KEK_recovery
 * (из recovery-кода). DEK сохраняется в сессии.
 */
export async function createRegistrationKeys(
  password: string,
  recoveryCode: string,
): Promise<RegistrationKeys> {
  const dataKey = await generateDataKey();

  const keySalt = generateSalt();
  const kek = await deriveKek(password, keySalt);
  const wrappedKey = await wrapDataKey(dataKey, kek);

  const recoverySalt = generateSalt();
  const recoveryKek = await deriveKek(recoveryCode, recoverySalt);
  const recoveryWrappedKey = await wrapDataKey(dataKey, recoveryKek);

  await setSessionKey(dataKey);

  return {
    wrappedKey,
    keySalt: toBase64(keySalt),
    recoveryWrappedKey,
    recoverySalt: toBase64(recoverySalt),
  };
}

/**
 * Логин: разворачиваем DEK из wrappedKey ключом, выведенным из пароля.
 * Если пароль неверен — AES-GCM расшифровка упадёт.
 */
export async function unlockDataKeyFromLogin(
  password: string,
  wrappedKey: string,
  keySalt: string,
): Promise<void> {
  const kek = await deriveKek(password, fromBase64(keySalt));
  const dataKey = await unwrapDataKey(wrappedKey, kek);
  await setSessionKey(dataKey);
}

/**
 * Сброс пароля с recovery-кодом: разворачиваем DEK кодом, пере-заворачиваем
 * новым паролем. Возвращает новый wrappedKey/keySalt для отправки на сервер.
 */
export async function rewrapDataKeyWithRecovery(
  recoveryCode: string,
  recoveryWrappedKey: string,
  recoverySalt: string,
  newPassword: string,
): Promise<PasswordWrappedKey> {
  const recoveryKek = await deriveKek(recoveryCode, fromBase64(recoverySalt));
  const dataKey = await unwrapDataKey(recoveryWrappedKey, recoveryKek);

  const keySalt = generateSalt();
  const kek = await deriveKek(newPassword, keySalt);
  const wrappedKey = await wrapDataKey(dataKey, kek);

  await setSessionKey(dataKey);
  return { wrappedKey, keySalt: toBase64(keySalt) };
}

/**
 * Сброс пароля без recovery-кода: генерируем новый DEK. Старые данные
 * становятся недоступны (расшифровать их больше нельзя).
 */
export async function createFreshDataKey(password: string): Promise<PasswordWrappedKey> {
  const dataKey = await generateDataKey();
  const keySalt = generateSalt();
  const kek = await deriveKek(password, keySalt);
  const wrappedKey = await wrapDataKey(dataKey, kek);
  await setSessionKey(dataKey);
  return { wrappedKey, keySalt: toBase64(keySalt) };
}
