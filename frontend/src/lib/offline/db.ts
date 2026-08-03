import Dexie, { type EntityTable } from "dexie";
import type { components } from "../api-types";

type Entry = components["schemas"]["Entry"];
type TestResult = components["schemas"]["TestResult"];

export type SyncEntity =
  | "entry"
  | "feedback"
  | "testResult"
  | "breathingSession"
  | "practiceCompletion"
  | "creatureState"
  | "userAchievement";

export type PushEntity = Exclude<SyncEntity, "userAchievement">;

export type SyncActionKind = "upsert" | "delete";

// Исходящая операция, попавшая в офлайн-очередь, когда соединение недоступно.
export interface SyncOutboxItem {
  id: string;
  entity: PushEntity;
  action: SyncActionKind;
  entityId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  createdAt: number;
}

// Зеркала входящих сущностей (дельты из pull) — локальный кэш для чтения.
export interface LocalEntry extends Entry {
  updatedAt?: string;
  deletedAt?: string | null;
}
export interface LocalTestResult extends TestResult {
  updatedAt?: string;
  deletedAt?: string | null;
}
export interface LocalFeedback {
  id: string;
  rating: number;
  message: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
export interface LocalCreature {
  id: string;
  userId?: string;
  calmness?: number;
  energy?: number;
  level?: number;
  experience?: number;
  streak?: number;
  lastCheckInAt?: string | null;
  lastExerciseAt?: string | null;
  activeSkin?: string;
  unlockedSkins?: string[];
  activeTitle?: string | null;
  unlockedTitles?: string[];
  petType?: string;
  unlockedPetTypes?: string[];
  petName?: string | null;
  feedCount?: number;
  feedCounts?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}
export interface LocalUserAchievement {
  id: string;
  achievementId?: string;
  unlockedAt?: string;
  notified?: boolean;
  updatedAt?: string;
}

let db: Dexie & {
  outbox: EntityTable<SyncOutboxItem, "id">;
  entries: EntityTable<LocalEntry, "id">;
  testResults: EntityTable<LocalTestResult, "id">;
  feedback: EntityTable<LocalFeedback, "id">;
  creature: EntityTable<LocalCreature, "id">;
  achievements: EntityTable<LocalUserAchievement, "id">;
  syncMeta: EntityTable<{ key: string; value?: string }, "key">;
};

export function getDb(): typeof db {
  if (!db) {
    db = new Dexie("moodly-db") as typeof db;
    db.version(1).stores({
      outbox: "id, createdAt",
      entries: "id, updatedAt, parameterId",
      testResults: "id, updatedAt, testId",
      feedback: "id, updatedAt",
      creature: "id, updatedAt",
      achievements: "id, updatedAt",
      syncMeta: "key",
    });
    db.version(2).stores({
      outbox: "id, createdAt",
      entries: "id, updatedAt, parameterId",
      testResults: "id, updatedAt, testId",
      feedback: "id, updatedAt",
      creature: "id, updatedAt",
      achievements: "id, updatedAt",
      syncMeta: "key",
    });
  }
  return db;
}

export async function getCursor(): Promise<string | undefined> {
  const row = await getDb().syncMeta.get("syncCursor");
  return row?.value;
}

export async function setCursor(value: string): Promise<void> {
  await getDb().syncMeta.put({ key: "syncCursor", value });
}

/** Локальное зеркало CreatureState (singleton: id = "creature-profile"). */
export async function getLocalCreature(): Promise<LocalCreature | undefined> {
  const row = await getDb().creature.toArray();
  return row[0];
}

/** Патчит локальное зеркало CreatureState (для офлайн-мутаций). */
export async function updateLocalCreature(
  patch: Partial<LocalCreature>,
): Promise<LocalCreature | undefined> {
  const db = getDb();
  const existing = await db.creature.get("creature-profile");
  const merged: LocalCreature = {
    ...existing,
    ...patch,
    id: "creature-profile",
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  await db.creature.put(merged);
  return merged;
}

/** Сохраняет локальное зеркало CreatureState целиком. */
export async function saveLocalCreature(state: Partial<LocalCreature>): Promise<LocalCreature> {
  const record: LocalCreature = {
    ...state,
    id: "creature-profile",
    updatedAt: new Date().toISOString(),
  };
  await getDb().creature.put(record);
  return record;
}

/** Локальный список разблокированных достижений. */
export async function listLocalAchievements(): Promise<LocalUserAchievement[]> {
  return getDb().achievements.toArray();
}

export interface LocalEntryFilter {
  parameterId?: string;
  from?: string;
  to?: string;
}

/** Локальное чтение записей (без удалённых) для локально-первичных UI-запросов. */
export async function listLocalEntries(filter: LocalEntryFilter = {}): Promise<LocalEntry[]> {
  let entries = await getDb().entries.toArray();
  if (filter.parameterId) entries = entries.filter((e) => e.parameterId === filter.parameterId);
  if (filter.from) entries = entries.filter((e) => !e.createdAt || e.createdAt >= filter.from!);
  if (filter.to) entries = entries.filter((e) => !e.createdAt || e.createdAt < filter.to!);
  return entries
    .filter((e) => !e.deletedAt)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}
