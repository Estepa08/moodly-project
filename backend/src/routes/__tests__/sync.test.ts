import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp, registerAndLogin } from "../../test/helpers.js";
import { PrismaClient } from "@prisma/client";
import { uuidv7 } from "@moodly/shared";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let token: string;
const prisma = new PrismaClient();

function push(actions: unknown[], t = token) {
  return app.inject({
    method: "POST",
    url: "/sync/push",
    headers: { authorization: `Bearer ${t}` },
    payload: { actions },
  });
}

function pull(query = "", t = token) {
  return app.inject({
    method: "GET",
    url: `/sync/pull${query}`,
    headers: { authorization: `Bearer ${t}` },
  });
}

function entryAction(id: string, parameterId: string, marker: string): unknown {
  return {
    entity: "entry",
    action: "upsert",
    id,
    occurredAt: new Date().toISOString(),
    payload: { parameterId, encryptedData: `ENC:${marker}` },
  };
}

beforeAll(async () => {
  app = await buildApp();
  const res = await registerAndLogin(app, "sync-test@example.com", "secret123");
  token = res.token;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("Sync push", () => {
  it("creates entries idempotently by id", async () => {
    const parameterId = (await prisma.parameter.create({ data: { name: "SyncEnergy" } })).id;
    const id = uuidv7();
    const action = entryAction(id, parameterId, "a1");

    const first = await push([action]);
    expect(first.statusCode).toBe(200);
    expect(first.json().applied).toBe(1);

    // повторная отправка того же действия не дублирует строку (upsert по id)
    const second = await push([action]);
    expect(second.statusCode).toBe(200);

    const count = await prisma.entry.count({ where: { parameterId } });
    expect(count).toBe(1);
    const updated = await prisma.entry.findUnique({ where: { id } });
    expect(updated?.encryptedData).toBe("ENC:a1");
    expect(updated?.value).toBeNull();
  });

  it("applies a delete as a cached tombstone (soft delete)", async () => {
    const parameter = (await prisma.parameter.create({ data: { name: "SyncDelete" } })).id;
    const id = uuidv7();
    await push([entryAction(id, parameter, "d1")]);

    const del = await push([
      { entity: "entry", action: "delete", id, occurredAt: new Date().toISOString(), payload: {} },
    ]);
    expect(del.statusCode).toBe(200);

    const row = await prisma.entry.findUnique({ where: { id } });
    expect(row).toBeTruthy();
    expect(row?.deletedAt).not.toBeNull();
  });

  it("rejects unknown entity / invalid payload", async () => {
    const bad = await push([
      {
        entity: "nope",
        action: "upsert",
        id: uuidv7(),
        occurredAt: new Date().toISOString(),
        payload: {},
      },
    ]);
    expect(bad.statusCode).toBe(400);

    const parameter = (await prisma.parameter.create({ data: { name: "SyncBad2" } })).id;
    const missingValue = await push([
      {
        entity: "entry",
        action: "upsert",
        id: uuidv7(),
        occurredAt: new Date().toISOString(),
        payload: { parameterId: parameter },
      },
    ]);
    expect(missingValue.statusCode).toBe(400);
  });
});

describe("Sync pull", () => {
  it("returns no changes before any data, and advances nothing", async () => {
    const user = await registerAndLogin(app, "sync-pull-empty@example.com", "secret123");
    const res = await pull("", user.token);
    expect(res.statusCode).toBe(200);
    expect(res.json().changes).toHaveLength(0);
  });

  it("returns created entry as a delta and persists the cursor", async () => {
    const user = await registerAndLogin(app, "sync-pull@example.com", "secret123");
    const parameter = (await prisma.parameter.create({ data: { name: "SyncPull" } })).id;
    const id = uuidv7();

    // создаём запись напрямую в БД (симуляция второй device/онлайн-фичи)
    await prisma.entry.create({
      data: { id, userId: user.userId, parameterId: parameter, encryptedData: "ENC:pull1" },
    });

    const res = await pull("", user.token);
    expect(res.statusCode).toBe(200);
    const change = res.json().changes.find((c: { id: string }) => c.id === id);
    expect(change.entity).toBe("entry");
    expect(change.action).toBe("upsert");
    expect(change.data.encryptedData).toBe("ENC:pull1");

    // курсор сохранён — повторный pull не вернёт ту же запись
    const again = await pull("", user.token);
    expect(again.json().changes.find((c: { id: string }) => c.id === id)).toBeUndefined();
  });

  it("paginates with (updatedAt, id) cursor and hasMore", async () => {
    const user = await registerAndLogin(app, "sync-paginate@example.com", "secret123");
    const parameter = (await prisma.parameter.create({ data: { name: "SyncPaginate" } })).id;

    for (let i = 0; i < 5; i++) {
      await prisma.entry.create({
        data: { id: uuidv7(), userId: user.userId, parameterId: parameter, value: i },
      });
    }

    const first = await pull("?limit=2", user.token);
    expect(first.statusCode).toBe(200);
    expect(first.json().changes).toHaveLength(2);
    expect(first.json().hasMore).toBe(true);

    const second = await pull(
      `?since=${encodeURIComponent(first.json().cursor)}&sinceId=${first.json().cursorId}&limit=100`,
      user.token,
    );
    expect(second.statusCode).toBe(200);
    expect(second.json().changes).toHaveLength(3);
    expect(second.json().hasMore).toBe(false);
  });

  it("returns a tombstone (delete) for soft-deleted rows", async () => {
    const user = await registerAndLogin(app, "sync-tombstone@example.com", "secret123");
    const parameter = (await prisma.parameter.create({ data: { name: "SyncTomb" } })).id;
    const id = uuidv7();
    await prisma.entry.create({
      data: { id, userId: user.userId, parameterId: parameter, value: 1 },
    });

    // сначала вытягиваем (чтобы запись была "известна"), затем мягко удаляем
    await pull("", user.token);
    await prisma.entry.update({ where: { id }, data: { deletedAt: new Date() } });

    const res = await pull("", user.token);
    const change = res.json().changes.find((c: { id: string }) => c.id === id);
    expect(change?.action).toBe("delete");
  });

  it("delivers a tombstone after a soft delete via sync push (updatedAt bump)", async () => {
    const user = await registerAndLogin(app, "sync-tombstone-push@example.com", "secret123");
    const parameter = (await prisma.parameter.create({ data: { name: "SyncTombPush" } })).id;
    const id = uuidv7();

    // запись создана через тот же механизм, что и клиент, и уже вытянута (курсор прошёл её updatedAt)
    await push([entryAction(id, parameter, "p1")], user.token);
    await pull("", user.token);

    // удаление через sync push — applySoftDelete должен бампнуть updatedAt,
    // чтобы tombstone прошёл фильтр pull по (updatedAt, id)
    const del = await push(
      [
        {
          entity: "entry",
          action: "delete",
          id,
          occurredAt: new Date().toISOString(),
          payload: {},
        },
      ],
      user.token,
    );
    expect(del.statusCode).toBe(200);

    const res = await pull("", user.token);
    const change = res.json().changes.find((c: { id: string }) => c.id === id);
    expect(change?.action).toBe("delete");
  });
});

describe("Sync push daily limit", () => {
  it("rejects the batch once DAILY_ENTRY_LIMIT (100) new entries are reached", async () => {
    const user = await registerAndLogin(app, "sync-limit@example.com", "secret123");
    const parameter = (await prisma.parameter.create({ data: { name: "SyncLimit" } })).id;

    const batch = Array.from({ length: 100 }, () => entryAction(uuidv7(), parameter, "l1"));
    const res = await push(batch, user.token);
    expect(res.statusCode).toBe(200);
    expect(res.json().applied).toBe(100);

    const over = await push([entryAction(uuidv7(), parameter, "l1")], user.token);
    expect(over.statusCode).toBe(429);
  });

  it("allowed when batch contains already-existing entry ids", async () => {
    const user = await registerAndLogin(app, "sync-limit-existing@example.com", "secret123");
    const parameter = (await prisma.parameter.create({ data: { name: "SyncLimit2" } })).id;
    const id = uuidv7();

    const first = await push([entryAction(id, parameter, "e1")], user.token);
    expect(first.statusCode).toBe(200);

    // повторная отправка двух "новых" батчей на существующий id и один новый
    const again = await push(
      [entryAction(id, parameter, "e2"), entryAction(uuidv7(), parameter, "e3")],
      user.token,
    );
    expect(again.statusCode).toBe(200);
    expect(again.json().applied).toBe(2);
  });
});

describe("Sync creatureState", () => {
  function creatureAction(id: string, payload: Record<string, unknown>): unknown {
    return {
      entity: "creatureState",
      action: "upsert",
      id,
      occurredAt: new Date().toISOString(),
      payload,
    };
  }

  it("creates a singleton row and updates it idempotently by userId", async () => {
    const user = await registerAndLogin(app, "sync-creature@example.com", "secret123");

    const res = await push(
      [
        creatureAction("creature-profile", {
          petType: "fox",
          level: 3,
          experience: 120,
          calmness: 60,
        }),
      ],
      user.token,
    );
    expect(res.statusCode).toBe(200);
    expect(res.json().applied).toBe(1);

    const row = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    expect(row?.petType).toBe("fox");
    expect(row?.level).toBe(3);
    expect(row?.experience).toBe(120);

    // повторный push — апдейт той же строки, не дубликат
    await push([creatureAction("creature-profile", { petType: "tucan", level: 4 })], user.token);
    const rows = await prisma.creatureState.findMany({ where: { userId: user.userId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.petType).toBe("tucan");
    expect(rows[0]?.level).toBe(4);
  });

  it("creates a default singleton row from an empty payload", async () => {
    const user = await registerAndLogin(app, "sync-creature-empty@example.com", "secret123");
    const res = await push([creatureAction("creature-profile", {})], user.token);
    expect(res.statusCode).toBe(200);
    const row = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    expect(row).not.toBeNull();
    expect(row?.level).toBe(1);
  });

  it("clamps out-of-range values", async () => {
    const user = await registerAndLogin(app, "sync-creature-clamp@example.com", "secret123");
    const res = await push(
      [creatureAction("creature-profile", { calmness: 500, energy: -10, level: 0 })],
      user.token,
    );
    expect(res.statusCode).toBe(200);
    const row = await prisma.creatureState.findUnique({ where: { userId: user.userId } });
    expect(row?.calmness).toBe(100);
    expect(row?.energy).toBe(0);
    expect(row?.level).toBe(1);
  });

  it("returns creatureState as a pull delta after cursor, then nothing", async () => {
    const user = await registerAndLogin(app, "sync-creature-pull@example.com", "secret123");
    await prisma.creatureState.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId, petType: "puff", level: 2 },
      update: { petType: "puff", level: 2 },
    });

    const first = await pull("", user.token);
    expect(first.statusCode).toBe(200);
    const changes = first.json().changes as { entity: string; id: string }[];
    expect(changes.some((c) => c.entity === "creatureState")).toBe(true);
    expect(changes.filter((c) => c.entity === "creatureState")).toHaveLength(1);

    const again = await pull("", user.token);
    expect(again.statusCode).toBe(200);
    const changes2 = again.json().changes as { entity: string }[];
    expect(changes2.filter((c) => c.entity === "creatureState")).toHaveLength(0);
  });
});

describe("Sync userAchievement (read-only from client)", () => {
  it("rejects a client push of userAchievement", async () => {
    const user = await registerAndLogin(app, "sync-ach-push@example.com", "secret123");
    const res = await push(
      [
        {
          entity: "userAchievement",
          action: "upsert",
          id: uuidv7(),
          payload: { achievementId: "x" },
        },
      ],
      user.token,
    );
    expect(res.statusCode).toBe(400);
  });

  it("returns user-achievements as pull deltas", async () => {
    const user = await registerAndLogin(app, "sync-ach-pull@example.com", "secret123");
    const achievement = await prisma.achievement.create({
      data: {
        key: `test_ach_${Date.now()}`,
        category: "test",
        titleKey: "achievements.test",
        descKey: "achievements.testDesc",
        iconName: "star",
        criteria: { type: "test" },
      },
    });
    await prisma.userAchievement.create({
      data: { userId: user.userId, achievementId: achievement.id },
    });

    const res = await pull("", user.token);
    expect(res.statusCode).toBe(200);
    const changes = res.json().changes as {
      entity: string;
      id: string;
      data: { achievementId?: string };
    }[];
    const ach = changes.find((c) => c.entity === "userAchievement");
    expect(ach?.data.achievementId).toBe(achievement.id);
  });
});
