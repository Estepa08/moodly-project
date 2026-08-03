import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { getDb } from "../db";
import { enqueue, flushOutbox, pullChanges, syncNow } from "../sync";
import { api } from "../../api";

beforeEach(async () => {
  const db = getDb();
  await db.transaction(
    "rw",
    db.outbox,
    db.entries,
    db.testResults,
    db.feedback,
    db.creature,
    db.achievements,
    db.syncMeta,
    () =>
      Promise.all([
        db.outbox.clear(),
        db.entries.clear(),
        db.testResults.clear(),
        db.feedback.clear(),
        db.creature.clear(),
        db.achievements.clear(),
        db.syncMeta.clear(),
      ]),
  );
  vi.spyOn(api.sync, "push").mockResolvedValue({ applied: 1 });
  vi.spyOn(api.sync, "pull").mockResolvedValue({
    cursor: "c",
    cursorId: "",
    hasMore: false,
    changes: [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("offline outbox", () => {
  it("enqueue ставит операцию в очередь и держит её там при ошибке сети", async () => {
    vi.mocked(api.sync.push).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.mocked(api.sync.pull).mockResolvedValueOnce({
      cursor: "c",
      cursorId: "",
      hasMore: false,
      changes: [],
    });

    await enqueue("entry", "upsert", "entry-1", { parameterId: "p1", value: 5 });

    expect(await getDb().outbox.count()).toBe(1);
    const item = await getDb().outbox.orderBy("createdAt").first();
    expect(item?.entity).toBe("entry");
    expect(item?.entityId).toBe("entry-1");
  });

  it("flushOutbox очищает очередь после успешной отправки", async () => {
    await getDb().outbox.add({
      id: "queue-2",
      entity: "entry",
      action: "upsert",
      entityId: "entry-2",
      payload: { parameterId: "p1", value: 5 },
      occurredAt: new Date().toISOString(),
      createdAt: Date.now(),
    });
    vi.mocked(api.sync.pull).mockResolvedValueOnce({
      cursor: "c",
      cursorId: "",
      hasMore: false,
      changes: [],
    });

    const flushed = await flushOutbox();
    expect(flushed).toBe(1);
    expect(await getDb().outbox.count()).toBe(0);
    expect(api.sync.push).toHaveBeenCalledTimes(1);
  });
});

describe("offline pull", () => {
  it("применяет дельту creatureState в локальное зеркало под фиксированным ключом", async () => {
    vi.mocked(api.sync.pull).mockResolvedValueOnce({
      cursor: "c",
      cursorId: "",
      hasMore: false,
      changes: [
        {
          entity: "creatureState",
          id: "some-row-id",
          action: "upsert",
          updatedAt: "2026-08-03T10:00:00.000Z",
          data: { petType: "tucan", level: 4, feedCount: 7 },
        },
      ],
    });

    await pullChanges();
    const creature = await getDb().creature.get("creature-profile");
    expect(creature?.petType).toBe("tucan");
    expect(creature?.level).toBe(4);
    expect(creature?.feedCount).toBe(7);
  });

  it("применяет дельту userAchievement по achievementId", async () => {
    vi.mocked(api.sync.pull).mockResolvedValueOnce({
      cursor: "c",
      cursorId: "",
      hasMore: false,
      changes: [
        {
          entity: "userAchievement",
          id: "unused",
          action: "upsert",
          updatedAt: "2026-08-03T10:00:00.000Z",
          data: { achievementId: "ach-42", unlockedAt: "2026-08-03T09:00:00.000Z" },
        },
      ],
    });

    await pullChanges();
    const ach = await getDb().achievements.get("ach-42");
    expect(ach?.achievementId).toBe("ach-42");
    expect(ach?.unlockedAt).toBe("2026-08-03T09:00:00.000Z");
  });

  it("применяет дельты и сохраняет курсор", async () => {
    vi.mocked(api.sync.pull).mockResolvedValueOnce({
      cursor: "2026-08-03T10:00:00.000Z",
      cursorId: "entry-9",
      hasMore: false,
      changes: [
        {
          entity: "entry",
          id: "entry-9",
          action: "upsert",
          updatedAt: "2026-08-03T10:00:00.000Z",
          data: { parameterId: "p1", value: 7, createdAt: "2026-08-03T09:00:00.000Z" },
        },
      ],
    });

    const pulled = await pullChanges();
    expect(pulled).toBe(1);

    const stored = await getDb().entries.get("entry-9");
    expect(stored?.value).toBe(7);
    expect(await getDb().syncMeta.get("syncCursor")).toMatchObject({
      value: "2026-08-03T10:00:00.000Z",
    });
  });

  it("применяет tombstone как удаление локальной записи", async () => {
    await getDb().entries.put({
      id: "entry-9",
      userId: "",
      parameterId: "p1",
      value: 7,
      createdAt: "x",
      updatedAt: "x",
    });

    vi.mocked(api.sync.pull).mockResolvedValueOnce({
      cursor: "2026-08-03T10:00:00.000Z",
      cursorId: "entry-9",
      hasMore: false,
      changes: [
        {
          entity: "entry",
          id: "entry-9",
          action: "delete",
          updatedAt: "2026-08-03T10:00:00.000Z",
          data: {},
        },
      ],
    });

    await pullChanges();
    expect(await getDb().entries.get("entry-9")).toBeUndefined();
  });

  it("пагинирует пока hasMore, и сохраняет курсор последней страницы", async () => {
    vi.mocked(api.sync.pull)
      .mockResolvedValueOnce({
        cursor: "c1",
        cursorId: "a",
        hasMore: true,
        changes: [
          {
            entity: "entry",
            id: "e1",
            action: "upsert",
            updatedAt: "2026-08-03T09:00:00.000Z",
            data: { value: 1 },
          },
        ],
      })
      .mockResolvedValueOnce({
        cursor: "c2",
        cursorId: "b",
        hasMore: false,
        changes: [
          {
            entity: "entry",
            id: "e2",
            action: "upsert",
            updatedAt: "2026-08-03T10:00:00.000Z",
            data: { value: 2 },
          },
        ],
      });

    const pulled = await pullChanges();
    expect(pulled).toBe(2);
    expect(await getDb().entries.get("e1")).toBeTruthy();
    expect(await getDb().entries.get("e2")).toBeTruthy();
    expect(await getDb().syncMeta.get("syncCursor")).toMatchObject({ value: "c2" });
  });
});

describe("syncNow", () => {
  it("сначала пушит, потом тянет", async () => {
    await getDb().outbox.add({
      id: "queue-3",
      entity: "entry",
      action: "upsert",
      entityId: "entry-3",
      payload: { parameterId: "p1", value: 5 },
      occurredAt: new Date().toISOString(),
      createdAt: Date.now(),
    });
    vi.mocked(api.sync.pull).mockResolvedValueOnce({
      cursor: "c",
      cursorId: "",
      hasMore: false,
      changes: [],
    });

    const result = await syncNow();
    expect(result).toEqual({ pushed: 1, pulled: 0 });
    expect(api.sync.pull).toHaveBeenCalledTimes(1);
  });
});
