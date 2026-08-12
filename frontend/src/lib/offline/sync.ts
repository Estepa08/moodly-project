import { uuidv7 } from '@moodly/shared';
import { api, type SyncAction, type SyncChange } from '../api';
import { getDb, getCursor, setCursor, type PushEntity, type SyncOutboxItem } from './db';
import { emit, setSyncStatus } from './syncStatus';

let flushing = false;
let pulling = false;

function nowIso(): string {
  return new Date().toISOString();
}

/** Ставит операцию в офлайн-очередь и сразу пытается отправить её на сервер. */
export async function enqueue(
  entity: PushEntity,
  action: 'upsert' | 'delete',
  entityId: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const item: SyncOutboxItem = {
    id: uuidv7(),
    entity,
    action,
    entityId,
    payload,
    occurredAt: nowIso(),
    createdAt: Date.now(),
  };
  await getDb().outbox.add(item);
  emit();
  try {
    await syncNow();
  } catch {
    // сеть недоступна — операция остаётся в очереди и уйдёт при следующем syncNow()
  }
}

/** Отправляет накопленные исходящие операции одним батчем (идемпотентно по id). */
export async function flushOutbox(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  try {
    const items = await getDb().outbox.orderBy('createdAt').toArray();
    if (items.length === 0) return 0;
    setSyncStatus('syncing');

    const actions: SyncAction[] = items.map((it) => ({
      entity: it.entity,
      action: it.action,
      id: it.entityId,
      occurredAt: it.occurredAt,
      payload: it.payload,
    }));

    const res = await api.sync.push(actions);
    if (res.applied > 0) {
      await getDb().outbox.bulkDelete(items.map((it) => it.id));
    }
    return res.applied;
  } finally {
    flushing = false;
    emit();
  }
}

async function applyLocal(entity: string, c: SyncChange): Promise<void> {
  const db = getDb();
  if (c.action === 'delete') {
    switch (entity) {
      case 'entry':
        await db.entries.delete(c.id);
        return;
      case 'feedback':
        await db.feedback.delete(c.id);
        return;
      case 'testResult':
        await db.testResults.delete(c.id);
        return;
    }
    return;
  }

  // LWW: локальная запись с более новым updatedAt не затирается дельтой сервера.
  const record = { id: c.id, ...c.data, updatedAt: c.updatedAt };
  switch (entity) {
    case 'entry': {
      const existing = await db.entries.get(c.id);
      if (!existing || (existing.updatedAt ?? '') <= c.updatedAt) {
        await db.entries.put(record as never);
      }
      return;
    }
    case 'feedback': {
      const existing = await db.feedback.get(c.id);
      if (!existing || (existing.updatedAt ?? '') <= c.updatedAt) {
        await db.feedback.put(record as never);
      }
      return;
    }
    case 'testResult': {
      const existing = await db.testResults.get(c.id);
      if (!existing || (existing.updatedAt ?? '') <= c.updatedAt) {
        await db.testResults.put(record as never);
      }
      return;
    }
    case 'creatureState': {
      // Локальное зеркало singleton-строки: фиксированный ключ, LWW по updatedAt.
      const existing = await db.creature.get('creature-profile');
      if (!existing || (existing.updatedAt ?? '') <= c.updatedAt) {
        await db.creature.put({ ...record, id: 'creature-profile' } as never);
      }
      return;
    }
    case 'userAchievement': {
      // Ключ локально — achievementId (стабильный id достижения из каталога).
      const achievementId = (c.data.achievementId as string | undefined) ?? c.id;
      const existing = await db.achievements.get(achievementId);
      if (!existing || (existing.updatedAt ?? '') <= c.updatedAt) {
        await db.achievements.put({ ...record, id: achievementId } as never);
      }
      return;
    }
    default:
      return;
  }
}

/** Вытягивает дельты с сервера в локальные таблицы (пагинация по (updatedAt, id)). */
export async function pullChanges(): Promise<number> {
  if (pulling) return 0;
  pulling = true;
  try {
    let since = await getCursor();
    let sinceId = '';
    let total = 0;

    for (;;) {
      const page = await api.sync.pull({ since, sinceId, limit: 500 });
      for (const c of page.changes) {
        await applyLocal(c.entity, c);
      }
      total += page.changes.length;

      if (!page.hasMore) {
        if (page.changes.length > 0) {
          await setCursor(page.cursor);
        }
        break;
      }
      since = page.cursor;
      sinceId = page.cursorId;
    }
    return total;
  } finally {
    pulling = false;
  }
}

/** Полный цикл синхронизации: flush исходящих, затем pull входящих. */
export async function syncNow(): Promise<{ pushed: number; pulled: number }> {
  const pushed = await flushOutbox();
  const pulled = await pullChanges();
  return { pushed, pulled };
}
