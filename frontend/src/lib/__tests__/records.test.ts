import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptEntryPayload,
  decryptEntryPayload,
  encryptTestResultPayload,
  decryptTestResultPayload,
  EntryCipherPayload,
  TestResultCipherPayload,
} from '../crypto/records';
import { generateDataKey } from '../crypto/keys';
import { setSessionKey, setSessionUserId, getSessionKey } from '../crypto/session';
import { encryptJson } from '../crypto/codec';
import { DistortionKey } from '../distortionsQuiz';

const dummyEntityId = 'test-id-123';
const dummyUserId = 'user-1';

const entryPayload: EntryCipherPayload = { value: 42, note: 'Test note' };
const testResultPayload: TestResultCipherPayload = {
  score: 85,
  maxScore: 100,
  interpretation: 'Good',
  recommendation: 'Keep it up',
  flags: { severity: 'medium' },
};

describe('crypto/records encryption and decryption', () => {
  beforeAll(async () => {
    const key = await generateDataKey();
    await setSessionKey(key);
    setSessionUserId(dummyUserId);
  });

  it('should encrypt and decrypt EntryCipherPayload correctly', async () => {
    const encrypted = await encryptEntryPayload(entryPayload, dummyEntityId);
    const decrypted = await decryptEntryPayload(encrypted, dummyEntityId);
    expect(decrypted.value).toBe(entryPayload.value);
    expect(decrypted.note).toBe(entryPayload.note);
    expect(decrypted.activities).toEqual([]);
  });

  it('should encrypt and decrypt day activities in EntryCipherPayload', async () => {
    const payload: EntryCipherPayload = {
      value: 0,
      note: null,
      activities: [{ key: 'movement.walk' }, { key: 'custom:abc', custom: true, label: 'Ретрит' }],
    };
    const encrypted = await encryptEntryPayload(payload, dummyEntityId);
    const decrypted = await decryptEntryPayload(encrypted, dummyEntityId);
    expect(decrypted.activities).toEqual(payload.activities);
  });

  it('should encrypt and decrypt cognitive distortion tags in EntryCipherPayload', async () => {
    const payload: EntryCipherPayload = {
      value: 4,
      note: 'Опять всё испортил',
      distortions: [DistortionKey.Magnification, DistortionKey.AllOrNothing],
    };
    const encrypted = await encryptEntryPayload(payload, dummyEntityId);
    const decrypted = await decryptEntryPayload(encrypted, dummyEntityId);
    expect(decrypted.distortions).toEqual([
      DistortionKey.Magnification,
      DistortionKey.AllOrNothing,
    ]);
  });

  it('should ignore malformed distortion tags in EntryCipherPayload', async () => {
    const key = await getSessionKey();
    const encrypted = await encryptJson(
      key,
      {
        value: 4,
        note: null,
        distortions: ['magnification', 'not-a-real-key', 42, null],
      },
      { userId: dummyUserId, entityId: dummyEntityId },
    );
    const decrypted = await decryptEntryPayload(encrypted, dummyEntityId);
    expect(decrypted.distortions).toEqual(['magnification']);
  });

  it('should encrypt and decrypt belief-before/after in EntryCipherPayload', async () => {
    const payload: EntryCipherPayload = {
      value: 4,
      note: 'Коллега не ответил',
      beliefBefore: 8,
      beliefAfter: 3,
    };
    const encrypted = await encryptEntryPayload(payload, dummyEntityId);
    const decrypted = await decryptEntryPayload(encrypted, dummyEntityId);
    expect(decrypted.beliefBefore).toBe(8);
    expect(decrypted.beliefAfter).toBe(3);
  });

  it('should ignore out-of-range or malformed belief values in EntryCipherPayload', async () => {
    const key = await getSessionKey();
    const encrypted = await encryptJson(
      key,
      { value: 4, note: null, beliefBefore: 11, beliefAfter: 'high' },
      { userId: dummyUserId, entityId: dummyEntityId },
    );
    const decrypted = await decryptEntryPayload(encrypted, dummyEntityId);
    expect(decrypted.beliefBefore).toBeUndefined();
    expect(decrypted.beliefAfter).toBeUndefined();
  });

  it('should ignore malformed activities list in EntryCipherPayload', async () => {
    const key = await getSessionKey();
    const encrypted = await encryptJson(
      key,
      { value: 0, note: null, activities: [{ bad: 'x' }, null, { key: 'ok' }] },
      { userId: dummyUserId, entityId: dummyEntityId },
    );
    const decrypted = await decryptEntryPayload(encrypted, dummyEntityId);
    expect(decrypted.activities).toEqual([{ key: 'ok' }]);
  });

  it('should encrypt and decrypt TestResultCipherPayload correctly', async () => {
    const encrypted = await encryptTestResultPayload(testResultPayload, dummyEntityId);
    const decrypted = await decryptTestResultPayload(encrypted, dummyEntityId);
    expect(decrypted.score).toBe(testResultPayload.score);
    expect(decrypted.maxScore).toBe(testResultPayload.maxScore);
    expect(decrypted.interpretation).toBe(testResultPayload.interpretation);
    expect(decrypted.recommendation).toBe(testResultPayload.recommendation);
    expect(decrypted.flags).toEqual(testResultPayload.flags);
  });

  it('should throw error on malformed EntryCipherPayload decryption', async () => {
    // корректно зашифрованный, но «битый» по структуре plaintext
    const key = await getSessionKey();
    const malformedEncrypted = await encryptJson(
      key,
      { value: 'not a number', note: null },
      {
        userId: dummyUserId,
        entityId: dummyEntityId,
      },
    );
    await expect(decryptEntryPayload(malformedEncrypted, dummyEntityId)).rejects.toThrow(
      'Decrypted entry payload is malformed',
    );
  });

  it('should throw error on malformed TestResultCipherPayload decryption', async () => {
    const key = await getSessionKey();
    const malformedEncrypted = await encryptJson(
      key,
      { score: 'not a number', interpretation: 123 },
      { userId: dummyUserId, entityId: dummyEntityId },
    );
    await expect(decryptTestResultPayload(malformedEncrypted, dummyEntityId)).rejects.toThrow(
      'Decrypted test result payload is malformed',
    );
  });
});
