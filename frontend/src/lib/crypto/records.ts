import { encryptJson, decryptJson } from "./codec";
import { getSessionKey, getSessionUserId } from "./session";

export interface ActivitySelection {
  key: string;
  custom?: boolean;
  label?: string;
}

export interface EntryCipherPayload {
  value: number;
  note: string | null;
  activities?: ActivitySelection[];
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
  if (!userId) throw new Error("Data key context is not initialized");
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
  if (typeof value !== "number") {
    throw new Error("Decrypted entry payload is malformed");
  }
  const activities = (raw as { activities?: unknown }).activities;
  const parsedActivities = Array.isArray(activities)
    ? (activities as ActivitySelection[]).filter((a) => a && typeof a.key === "string")
    : [];
  return {
    value,
    note: typeof note === "string" ? note : null,
    activities: parsedActivities,
  };
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
  if (typeof r.score !== "number" || typeof r.interpretation !== "string") {
    throw new Error("Decrypted test result payload is malformed");
  }
  return r;
}
