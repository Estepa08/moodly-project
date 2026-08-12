import { describe, it, expect, beforeEach } from 'vitest';
import { loadMyActivities, createMyActivity, removeMyActivity } from '../myActivities';

const KEY = 'moodly_my_activities';

describe('myActivities store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty list when nothing stored', () => {
    expect(loadMyActivities()).toEqual([]);
  });

  it('creates a custom activity with unique key and persists it', () => {
    const a = createMyActivity('Ретрит');
    expect(a.label).toBe('Ретрит');
    expect(a.key).toMatch(/^custom:/);
    const b = createMyActivity('Хайкинг');
    expect(b.key).not.toBe(a.key);
    expect(loadMyActivities()).toHaveLength(2);
  });

  it('removes an activity from the catalog', () => {
    const a = createMyActivity('Ретрит');
    createMyActivity('Йога');
    removeMyActivity(a.key);
    const list = loadMyActivities();
    expect(list).toHaveLength(1);
    expect(list[0].label).toBe('Йога');
  });

  it('ignores corrupted storage payload', () => {
    localStorage.setItem(KEY, JSON.stringify([{ bad: 1 }, { key: 'custom:ok', label: 'ok' }]));
    expect(loadMyActivities()).toEqual([{ key: 'custom:ok', label: 'ok' }]);
  });

  it('survives remove of unknown key', () => {
    expect(() => removeMyActivity('custom:nope')).not.toThrow();
    expect(loadMyActivities()).toEqual([]);
  });
});
