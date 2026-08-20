import { encryptJson, decryptJson } from './codec';
import { getSessionKey, getSessionUserId } from './session';
import { DISTORTION_KEYS, DistortionKey } from '../distortionsQuiz';
import { isEmotionKey, getDyadByKey } from '@moodly/shared';

export interface ActivitySelection {
  key: string;
  custom?: boolean;
  label?: string;
}

export interface EntryCipherPayload {
  value: number;
  note: string | null;
  activities?: ActivitySelection[];
  distortions?: DistortionKey[];
  /** Насколько сильно пользователь верил в мысль до переформулировки, 0–10. */
  beliefBefore?: number;
  /** То же самое — после того, как написал(а) альтернативную мысль. */
  beliefAfter?: number;
  /**
   * Текст альтернативной мысли отдельно от `note` (которая объединяет
   * ситуацию/мысль/альтернативу для истории) — нужен для поиска прошлого
   * переосмысления по тегу без парсинга локализованной разметки заметки.
   */
  alternativeThought?: string;
  /**
   * Эмоции из «Лаборатории эмоций» (см. @moodly/shared emotionAlchemy) —
   * ключи базовых эмоций (joy…) и/или открытых диад (love, guilt…).
   */
  emotions?: string[];
}

export interface TestResultCipherPayload {
  score: number;
  maxScore: number;
  interpretation: string;
  recommendation: string;
  flags?: Record<string, unknown>;
}

export interface EncryptContext {
  userId: string;
  entityId: string;
}

async function ctxFor(entityId: string): Promise<EncryptContext> {
  const userId = getSessionUserId();
  if (!userId) throw new Error('Data key context is not initialized');
  return { userId, entityId };
}

export async function encryptEntryPayload(
  data: EntryCipherPayload,
  entityId: string,
): Promise<string> {
  const key = await getSessionKey();
  return encryptJson(key, data, await ctxFor(entityId));
}

export async function decryptEntryPayload(
  encryptedData: string,
  entityId: string,
): Promise<EntryCipherPayload> {
  const key = await getSessionKey();
  const raw = await decryptJson(key, encryptedData, await ctxFor(entityId));
  const value = (raw as { value?: unknown }).value;
  const note = (raw as { note?: unknown }).note ?? null;
  if (typeof value !== 'number') {
    throw new Error('Decrypted entry payload is malformed');
  }
  const activities = (raw as { activities?: unknown }).activities;
  const parsedActivities = Array.isArray(activities)
    ? (activities as ActivitySelection[]).filter((a) => a && typeof a.key === 'string')
    : [];
  const distortions = (raw as { distortions?: unknown }).distortions;
  const parsedDistortions = Array.isArray(distortions)
    ? (distortions as DistortionKey[]).filter(
        (d) => typeof d === 'string' && (DISTORTION_KEYS as string[]).includes(d),
      )
    : [];
  const beliefBefore = parseBeliefValue((raw as { beliefBefore?: unknown }).beliefBefore);
  const beliefAfter = parseBeliefValue((raw as { beliefAfter?: unknown }).beliefAfter);
  const alternativeThoughtRaw = (raw as { alternativeThought?: unknown }).alternativeThought;
  const alternativeThought =
    typeof alternativeThoughtRaw === 'string' && alternativeThoughtRaw.trim().length > 0
      ? alternativeThoughtRaw
      : undefined;
  const emotionsRaw = (raw as { emotions?: unknown }).emotions;
  const parsedEmotions = Array.isArray(emotionsRaw)
    ? (emotionsRaw as unknown[]).filter(
        (e): e is string => typeof e === 'string' && (isEmotionKey(e) || !!getDyadByKey(e)),
      )
    : [];
  return {
    value,
    note: typeof note === 'string' ? note : null,
    activities: parsedActivities,
    distortions: parsedDistortions,
    ...(beliefBefore !== undefined ? { beliefBefore } : {}),
    ...(beliefAfter !== undefined ? { beliefAfter } : {}),
    ...(alternativeThought !== undefined ? { alternativeThought } : {}),
    ...(parsedEmotions.length > 0 ? { emotions: parsedEmotions } : {}),
  };
}

function parseBeliefValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10
    ? value
    : undefined;
}

/**
 * Извлекает активности из «легаси»-заметки — записи без шифротекста, которые
 * создаёт seed-скрипт для demo-аккаунта: в note лежит JSON-массив
 * ActivitySelection. Обычные текстовые заметки (не начинающиеся с "[")
 * игнорируются, чтобы не задеть семантику других параметров.
 */
export function parseLegacyActivities(note: string | null | undefined): ActivitySelection[] {
  if (!note) return [];
  const trimmed = note.trim();
  if (!trimmed.startsWith('[')) return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is ActivitySelection => !!a && typeof (a as ActivitySelection).key === 'string',
    );
  } catch {
    return [];
  }
}

export async function encryptTestResultPayload(
  data: TestResultCipherPayload,
  entityId: string,
): Promise<string> {
  const key = await getSessionKey();
  return encryptJson(key, data, await ctxFor(entityId));
}

export async function decryptTestResultPayload(
  encryptedData: string,
  entityId: string,
): Promise<TestResultCipherPayload> {
  const key = await getSessionKey();
  const raw = await decryptJson(key, encryptedData, await ctxFor(entityId));
  const r = raw as TestResultCipherPayload;
  if (typeof r.score !== 'number' || typeof r.interpretation !== 'string') {
    throw new Error('Decrypted test result payload is malformed');
  }
  return r;
}
