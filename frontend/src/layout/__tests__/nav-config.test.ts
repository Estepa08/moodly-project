import { describe, it, expect } from 'vitest';
import { OTHER_ITEMS, BOTTOM_NAV_ITEMS, filterNavForMode, PROGRESS_PATH } from '../nav-config';

// Классический режим (docs/plans/three-personas-design-gaps.md, Сессия 1)
// скрывает пункт «Прогресс» (серии/heatmap/уровень/XP/достижения) из навигации.
describe('filterNavForMode', () => {
  it('keeps all items unchanged for companion mode', () => {
    expect(filterNavForMode(OTHER_ITEMS, false)).toEqual(OTHER_ITEMS);
    expect(filterNavForMode(BOTTOM_NAV_ITEMS, false)).toEqual(BOTTOM_NAV_ITEMS);
  });

  it('drops the Progress item for classic mode', () => {
    const filteredOther = filterNavForMode(OTHER_ITEMS, true);
    const filteredBottom = filterNavForMode(BOTTOM_NAV_ITEMS, true);

    expect(filteredOther.some((item) => item.path === PROGRESS_PATH)).toBe(false);
    expect(filteredBottom.some((item) => item.path === PROGRESS_PATH)).toBe(false);
    // Остальные пункты (не игровые) остаются на месте.
    expect(filteredOther.length).toBe(OTHER_ITEMS.length - 1);
    expect(filteredBottom.length).toBe(BOTTOM_NAV_ITEMS.length - 1);
  });
});
