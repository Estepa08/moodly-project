// Логика «прогулки» компаньона (см. docs/gamification-phase2-visuals.svg,
// ряд 1). Стартует автоматически на бэкенде после check-in
// (CreatureState.adventureReturnAt) — здесь только чтение серверного
// состояния и форматирование, без своего рандома/таймера на клиенте.

export type AdventurePhase = 'active' | 'ready' | null;

// 'active' — гуляет, вернётся позже; 'ready' — время пришло, можно забрать
// награду; null — прогулки нет вовсе (adventureReturnAt пуст).
export function adventurePhase(
  adventureReturnAt: string | null | undefined,
  now = new Date(),
): AdventurePhase {
  if (!adventureReturnAt) return null;
  const returnAt = new Date(adventureReturnAt).getTime();
  if (Number.isNaN(returnAt)) return null;
  return returnAt > now.getTime() ? 'active' : 'ready';
}

// Локальное время возврата в формате «18:40» — для подсказки «вернётся ~HH:MM».
export function formatReturnTime(adventureReturnAt: string): string {
  return new Date(adventureReturnAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
