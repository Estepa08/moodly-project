import { describe, it, expect } from 'vitest';
import { getCurrentSeason } from '../../../lib/season';

// Времена без 'Z' — парсятся как локальные (как в dailyCard.test.ts), чтобы
// граничные даты не «съезжали» на соседний день в CI с другим TZ.
describe('getCurrentSeason', () => {
  it('returns winter for january', () => {
    expect(getCurrentSeason(new Date('2026-01-15T12:00:00'))).toBe('winter');
  });

  it('returns winter for the last day of february', () => {
    expect(getCurrentSeason(new Date('2026-02-28T12:00:00'))).toBe('winter');
  });

  it('returns spring for the first day of march', () => {
    expect(getCurrentSeason(new Date('2026-03-01T12:00:00'))).toBe('spring');
  });

  it('returns spring for may', () => {
    expect(getCurrentSeason(new Date('2026-05-31T12:00:00'))).toBe('spring');
  });

  it('returns summer for the first day of june', () => {
    expect(getCurrentSeason(new Date('2026-06-01T12:00:00'))).toBe('summer');
  });

  it('returns summer for august', () => {
    expect(getCurrentSeason(new Date('2026-08-29T12:00:00'))).toBe('summer');
  });

  it('returns autumn for the first day of september', () => {
    expect(getCurrentSeason(new Date('2026-09-01T12:00:00'))).toBe('autumn');
  });

  it('returns autumn for november', () => {
    expect(getCurrentSeason(new Date('2026-11-30T12:00:00'))).toBe('autumn');
  });

  it('returns winter for the first day of december', () => {
    expect(getCurrentSeason(new Date('2026-12-01T12:00:00'))).toBe('winter');
  });
});
