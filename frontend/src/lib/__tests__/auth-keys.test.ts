import { describe, it, expect, beforeAll } from 'vitest';
import {
  createRegistrationKeys,
  unlockDataKeyFromLogin,
  rewrapDataKeyWithRecovery,
} from '../crypto/auth-keys';
import { clearSessionKey, getSessionKeyRaw, setSessionUserId } from '../crypto/session';
import { encryptEntryPayload, decryptEntryPayload } from '../crypto/records';

describe('crypto/auth-keys — password & recovery key flow', () => {
  const password = 'SuperSecret123!';
  const recoveryCode = 'ABCD-EFGH-JKLM-NPQR';
  let reg: Awaited<ReturnType<typeof createRegistrationKeys>>;

  beforeAll(async () => {
    clearSessionKey();
    setSessionUserId('user-auth-flow');
    reg = await createRegistrationKeys(password, recoveryCode);
  });

  it('returns wrapped keys for both password and recovery code', () => {
    expect(reg.wrappedKey).toBeTruthy();
    expect(reg.keySalt).toBeTruthy();
    expect(reg.recoveryWrappedKey).toBeTruthy();
    expect(reg.recoverySalt).toBeTruthy();
  });

  it('unlocks the same DEK on login with the correct password', async () => {
    await unlockDataKeyFromLogin(password, reg.wrappedKey, reg.keySalt);
    const raw = getSessionKeyRaw();
    expect(raw).toBeTruthy();

    // запись, зашифрованная DEK из сессии, должна расшифровываться обратно
    const enc = await encryptEntryPayload({ value: 7, note: 'hi' }, 'e1');
    const dec = await decryptEntryPayload(enc, 'e1');
    expect(dec.value).toBe(7);
  });

  it('fails to unlock with a wrong password', async () => {
    await expect(
      unlockDataKeyFromLogin('WrongPassword', reg.wrappedKey, reg.keySalt),
    ).rejects.toThrow();
  });

  it('rewraps the DEK with recovery code and a new password', async () => {
    const rewrap = await rewrapDataKeyWithRecovery(
      recoveryCode,
      reg.recoveryWrappedKey,
      reg.recoverySalt,
      'NewPassword456!',
    );
    expect(rewrap.wrappedKey).toBeTruthy();
    expect(rewrap.keySalt).toBeTruthy();

    // новый пароль разворачивает тот же DEK
    await unlockDataKeyFromLogin('NewPassword456!', rewrap.wrappedKey, rewrap.keySalt);
    const enc = await encryptEntryPayload({ value: 3, note: 'works' }, 'e2');
    const dec = await decryptEntryPayload(enc, 'e2');
    expect(dec.value).toBe(3);
  });

  it('does not unlock with the wrong recovery code', async () => {
    await expect(
      rewrapDataKeyWithRecovery(
        'XXXX-XXXX-XXXX-XXXX',
        reg.recoveryWrappedKey,
        reg.recoverySalt,
        'NewPassword456!',
      ),
    ).rejects.toThrow();
  });
});
