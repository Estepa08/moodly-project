import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { DAILY_ENTRY_LIMIT } from "@moodly/shared";

export type SyncEntity =
  | "entry"
  | "feedback"
  | "testResult"
  | "breathingSession"
  | "practiceCompletion"
  | "creatureState"
  | "userAchievement";

export interface SyncAction {
  entity: SyncEntity;
  action: "upsert" | "delete";
  id: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface SyncChange {
  entity: SyncEntity;
  id: string;
  action: "upsert" | "delete";
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface PullResult {
  cursor: string;
  cursorId: string;
  hasMore: boolean;
  changes: SyncChange[];
}

const ENTITIES: SyncEntity[] = [
  "entry",
  "feedback",
  "testResult",
  "breathingSession",
  "practiceCompletion",
  "creatureState",
  "userAchievement",
];

// Сущности, которые клиент вправе пушить. userAchievement — pull-only:
// разблокировки вычисляет серверный achievementsService.check(), клиент не участвует.
const PUSH_ENTITIES: SyncEntity[] = [
  "entry",
  "feedback",
  "testResult",
  "breathingSession",
  "practiceCompletion",
  "creatureState",
];

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function isoDate(v: unknown): Date | undefined {
  if (typeof v !== "string") return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// Валидация mutable-полей сущности. Возвращает объект для prisma create/update
// (без id/userId/updatedAt/deletedAt — ими управляет сервер).
function sanitize(entity: SyncEntity, payload: Record<string, unknown>): Record<string, unknown> {
  switch (entity) {
    case "entry": {
      const parameterId = str(payload.parameterId);
      const encryptedData = str(payload.encryptedData);
      if (!parameterId || !encryptedData) {
        throw new AppError("INVALID_PAYLOAD", 400, "entry requires parameterId and encryptedData");
      }
      // E2E: сервер не хранит открытые значения — только шифротекст.
      // value/note зануляются навсегда (миграция старых записей).
      return { parameterId, encryptedData, value: null, note: null };
    }
    case "feedback": {
      const rating = num(payload.rating);
      const message = str(payload.message);
      if (rating === undefined || message === undefined) {
        throw new AppError("INVALID_PAYLOAD", 400, "feedback requires rating and message");
      }
      return { rating: Math.trunc(rating), message };
    }
    case "testResult": {
      const testId = str(payload.testId);
      const encryptedData = str(payload.encryptedData);
      if (!testId || !encryptedData) {
        throw new AppError("INVALID_PAYLOAD", 400, "testResult requires testId and encryptedData");
      }
      // E2E: сервер не хранит score/interpretation/recommendation — только шифротекст.
      return {
        testId,
        encryptedData,
        score: null,
        interpretation: null,
        recommendation: null,
        flags: null,
        completedAt: isoDate(payload.completedAt) ?? new Date(),
      };
    }
    case "breathingSession": {
      const duration = num(payload.duration);
      const initialCalmness = num(payload.initialCalmness);
      const finalCalmness = num(payload.finalCalmness);
      if (duration === undefined || initialCalmness === undefined || finalCalmness === undefined) {
        throw new AppError("INVALID_PAYLOAD", 400, "breathingSession payload incomplete");
      }
      return {
        duration: Math.trunc(duration),
        initialCalmness: Math.trunc(initialCalmness),
        finalCalmness: Math.trunc(finalCalmness),
        completedAt: isoDate(payload.completedAt) ?? new Date(),
      };
    }
    case "practiceCompletion": {
      const source = str(payload.source);
      const xpAwarded = num(payload.xpAwarded);
      if (!source || xpAwarded === undefined) {
        throw new AppError(
          "INVALID_PAYLOAD",
          400,
          "practiceCompletion requires source and xpAwarded",
        );
      }
      return { source, xpAwarded: Math.trunc(xpAwarded) };
    }
    case "creatureState": {
      return sanitizeCreatureState(payload);
    }
    case "userAchievement":
      throw new AppError("INVALID_PAYLOAD", 400, "userAchievement is read-only (pull-only)");
  }
}

function strArray(v: unknown): string[] | undefined {
  return Array.isArray(v) && v.every((x) => typeof x === "string")
    ? (v as string[]).slice(0, 200)
    : undefined;
}

function numRecord(v: unknown): Record<string, number> | undefined {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "number" && Number.isFinite(val)) out[k] = val;
  }
  return out;
}

function intClamp(v: unknown, min: number, max: number): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return Math.min(max, Math.max(min, Math.trunc(v)));
}

function sanitizeCreatureState(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const calmness = intClamp(payload.calmness, 0, 100);
  if (calmness !== undefined) out.calmness = calmness;
  const energy = intClamp(payload.energy, 0, 100);
  if (energy !== undefined) out.energy = energy;
  const level = intClamp(payload.level, 1, 999);
  if (level !== undefined) out.level = level;
  const experience = intClamp(payload.experience, 0, 1_000_000_000);
  if (experience !== undefined) out.experience = experience;
  const streak = intClamp(payload.streak, 0, 100_000);
  if (streak !== undefined) out.streak = streak;
  const feedCount = intClamp(payload.feedCount, 0, 1_000_000_000);
  if (feedCount !== undefined) out.feedCount = feedCount;

  if (payload.lastCheckInAt !== undefined) {
    out.lastCheckInAt =
      payload.lastCheckInAt === null ? null : (isoDate(payload.lastCheckInAt) ?? null);
  }
  if (payload.lastExerciseAt !== undefined) {
    out.lastExerciseAt =
      payload.lastExerciseAt === null ? null : (isoDate(payload.lastExerciseAt) ?? null);
  }

  const activeSkin = str(payload.activeSkin);
  if (activeSkin !== undefined) out.activeSkin = activeSkin;
  const petType = str(payload.petType);
  if (petType !== undefined) out.petType = petType;
  if (payload.petName !== undefined) {
    out.petName = payload.petName === null ? null : (str(payload.petName) ?? null);
  }
  const petMood = str(payload.petMood);
  if (petMood !== undefined) out.petMood = petMood;
  if (payload.activeTitle !== undefined) {
    out.activeTitle = payload.activeTitle === null ? null : (str(payload.activeTitle) ?? null);
  }

  const unlockedSkins = strArray(payload.unlockedSkins);
  if (unlockedSkins !== undefined) out.unlockedSkins = unlockedSkins;
  const unlockedTitles = strArray(payload.unlockedTitles);
  if (unlockedTitles !== undefined) out.unlockedTitles = unlockedTitles;
  const unlockedPetTypes = strArray(payload.unlockedPetTypes);
  if (unlockedPetTypes !== undefined) out.unlockedPetTypes = unlockedPetTypes;
  const feedCounts = numRecord(payload.feedCounts);
  if (feedCounts !== undefined) out.feedCounts = feedCounts;

  return out;
}

async function applyUpsert(
  tx: Prisma.TransactionClient,
  entity: SyncEntity,
  userId: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  switch (entity) {
    case "entry":
      await tx.entry.upsert({
        where: { id },
        create: { id, userId, ...data } as Prisma.EntryUncheckedCreateInput,
        update: data as Prisma.EntryUncheckedUpdateInput,
      });
      return;
    case "feedback":
      await tx.feedback.upsert({
        where: { id },
        create: { id, userId, ...data } as Prisma.FeedbackUncheckedCreateInput,
        update: data as Prisma.FeedbackUncheckedUpdateInput,
      });
      return;
    case "testResult":
      await tx.testResult.upsert({
        where: { id },
        create: { id, userId, ...data } as Prisma.TestResultUncheckedCreateInput,
        update: data as Prisma.TestResultUncheckedUpdateInput,
      });
      return;
    case "breathingSession":
      await tx.breathingSession.upsert({
        where: { id },
        create: { id, userId, ...data } as Prisma.BreathingSessionUncheckedCreateInput,
        update: data as Prisma.BreathingSessionUncheckedUpdateInput,
      });
      return;
    case "practiceCompletion":
      await tx.practiceCompletion.upsert({
        where: { id },
        create: { id, userId, ...data } as Prisma.PracticeCompletionUncheckedCreateInput,
        update: data as Prisma.PracticeCompletionUncheckedUpdateInput,
      });
      return;
    case "creatureState":
      // Singleton-строка (userId @unique): клиент — автор истины, LWW по строке.
      await tx.creatureState.upsert({
        where: { userId },
        create: { userId, ...data } as Prisma.CreatureStateUncheckedCreateInput,
        update: data as Prisma.CreatureStateUncheckedUpdateInput,
      });
      return;
  }
}

async function applySoftDelete(
  tx: Prisma.TransactionClient,
  entity: SyncEntity,
  userId: string,
  id: string,
): Promise<void> {
  const deletedAt = new Date();
  switch (entity) {
    case "entry":
      await tx.entry.updateMany({ where: { id, userId }, data: { deletedAt } });
      return;
    case "feedback":
      await tx.feedback.updateMany({ where: { id, userId }, data: { deletedAt } });
      return;
    case "testResult":
      await tx.testResult.updateMany({ where: { id, userId }, data: { deletedAt } });
      return;
    case "breathingSession":
      await tx.breathingSession.updateMany({ where: { id, userId }, data: { deletedAt } });
      return;
    case "practiceCompletion":
      await tx.practiceCompletion.updateMany({ where: { id, userId }, data: { deletedAt } });
      return;
    case "creatureState":
      // Singleton без deletedAt: удаление не поддерживается.
      return;
    case "userAchievement":
      // pull-only сущность: клиент не удаляет разблокировки.
      return;
  }
}

export const syncService = {
  async push(userId: string, actions: SyncAction[]) {
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new AppError("INVALID_PAYLOAD", 400, "push requires a non-empty actions array");
    }
    if (actions.length > 500) {
      throw new AppError("TOO_MANY", 413, "batch too large (max 500)");
    }
    for (const a of actions) {
      if (!PUSH_ENTITIES.includes(a.entity)) {
        throw new AppError("INVALID_PAYLOAD", 400, `unknown entity for push: ${a.entity}`);
      }
      if (a.action !== "upsert" && a.action !== "delete") {
        throw new AppError("INVALID_PAYLOAD", 400, `unknown action: ${a.action}`);
      }
      if (typeof a.id !== "string" || a.id.length < 8 || a.id.length > 80) {
        throw new AppError("INVALID_PAYLOAD", 400, "invalid id");
      }
      if (a.occurredAt && Number.isNaN(new Date(a.occurredAt).getTime())) {
        throw new AppError("INVALID_PAYLOAD", 400, "invalid occurredAt");
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayEntryCount = await prisma.entry.count({
      where: { userId, createdAt: { gte: startOfToday } },
    });

    const batchEntryIds = actions
      .filter((a) => a.entity === "entry" && a.action === "upsert")
      .map((a) => a.id);
    const existingEntryIds =
      batchEntryIds.length > 0
        ? new Set(
            (
              await prisma.entry.findMany({
                where: { id: { in: batchEntryIds } },
                select: { id: true },
              })
            ).map((r) => r.id),
          )
        : new Set<string>();

    let newEntries = 0;

    await prisma.$transaction(async (tx) => {
      for (const action of actions) {
        if (action.action === "delete") {
          await applySoftDelete(tx, action.entity, userId, action.id);
          continue;
        }
        if (action.entity === "entry" && !existingEntryIds.has(action.id)) {
          newEntries += 1;
          if (todayEntryCount + newEntries > DAILY_ENTRY_LIMIT) {
            throw new AppError("DAILY_LIMIT", 429, "Daily entry limit reached");
          }
        }
        const data = sanitize(action.entity, action.payload);
        await applyUpsert(tx, action.entity, userId, action.id, data);
      }
    });

    return { applied: actions.length };
  },

  async pull(
    userId: string,
    opts: { since?: string; sinceId?: string; limit?: number },
  ): Promise<PullResult> {
    const limit = Math.min(Math.max(opts.limit ?? 500, 1), 1000);

    let cursor: Date;
    let sinceId = opts.sinceId ?? "";
    if (opts.since) {
      const parsed = new Date(opts.since);
      cursor = Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
    } else {
      const stored = await prisma.syncCursor.findUnique({ where: { userId } });
      cursor = stored?.lastPulledAt ?? new Date(0);
      sinceId = stored?.lastPulledId ?? "";
    }

    const upTo = new Date();
    const changes: SyncChange[] = [];
    let budget = limit;
    let hasMore = false;

    for (const entity of ENTITIES) {
      if (budget <= 0) break;
      const rows = await pullRows(entity, userId, cursor, sinceId, budget + 1);
      const taken = rows.slice(0, budget);
      if (rows.length > budget) {
        hasMore = true;
      }
      for (const row of taken) {
        const { id, updatedAt, deletedAt, ...rest } = row as {
          id: string;
          updatedAt: Date;
          deletedAt: Date | null;
          [k: string]: unknown;
        };
        changes.push({
          entity,
          id,
          action: deletedAt ? "delete" : "upsert",
          updatedAt: updatedAt.toISOString(),
          data: { ...rest, createdAt: (row as { createdAt?: Date }).createdAt },
        });
      }
      budget -= taken.length;
      if (hasMore) break;
    }

    let nextCursor = upTo;
    let nextCursorId = "";
    if (changes.length > 0) {
      const last = changes[changes.length - 1];
      nextCursor = new Date(last.updatedAt);
      nextCursorId = last.id;
    }

    // Курсор продвигается только когда батч полностью обработан (нет hasMore),
    // иначе клиент продолжает вытягивать с того же (updatedAt, id).
    if (!hasMore) {
      await prisma.syncCursor.upsert({
        where: { userId },
        create: { userId, lastPulledAt: nextCursor, lastPulledId: nextCursorId || null },
        update: { lastPulledAt: nextCursor, lastPulledId: nextCursorId || null },
      });
    }

    return {
      cursor: nextCursor.toISOString(),
      cursorId: nextCursorId,
      hasMore,
      changes,
    };
  },
};

async function pullRows(
  entity: SyncEntity,
  userId: string,
  cursor: Date,
  sinceId: string,
  limit: number,
): Promise<Record<string, unknown>[]> {
  const base = sinceId
    ? ({
        userId,
        OR: [{ updatedAt: { gt: cursor } }, { updatedAt: cursor, id: { gt: sinceId } }],
      } as never)
    : ({ userId, updatedAt: { gt: cursor } } as never);

  switch (entity) {
    case "entry":
      return (await prisma.entry.findMany({
        where: base,
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: limit,
      })) as never;
    case "feedback":
      return (await prisma.feedback.findMany({
        where: base,
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: limit,
      })) as never;
    case "testResult":
      return (await prisma.testResult.findMany({
        where: base,
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: limit,
      })) as never;
    case "breathingSession":
      return (await prisma.breathingSession.findMany({
        where: base,
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: limit,
      })) as never;
    case "practiceCompletion":
      return (await prisma.practiceCompletion.findMany({
        where: base,
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: limit,
      })) as never;
    case "creatureState":
      return (await prisma.creatureState.findMany({
        where: base,
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: limit,
      })) as never;
    case "userAchievement":
      return (await prisma.userAchievement.findMany({
        where: base,
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: limit,
      })) as never;
  }
}
