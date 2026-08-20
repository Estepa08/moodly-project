import { describe, it, expect } from 'vitest';
import { computeTargetRotation, pickRandomSegmentIndex } from '../wheelMath';

describe('pickRandomSegmentIndex', () => {
  it('returns an index within bounds', () => {
    for (let i = 0; i < 200; i++) {
      const idx = pickRandomSegmentIndex(7);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(7);
    }
  });
});

describe('computeTargetRotation', () => {
  it('always spins forward (never returns a smaller rotation than the current one)', () => {
    for (let i = 0; i < 50; i++) {
      const current = i * 137; // произвольные накопленные значения из предыдущих спинов
      const next = computeTargetRotation(current, i % 5, 5);
      expect(next).toBeGreaterThan(current);
    }
  });

  it('adds between 5 and 8 extra full turns worth of rotation', () => {
    const current = 0;
    for (let i = 0; i < 50; i++) {
      const next = computeTargetRotation(current, 0, 4);
      const turns = next / 360;
      // 5-8 полных оборотов + доля оборота на джиттер/угол сегмента
      expect(turns).toBeGreaterThanOrEqual(5);
      expect(turns).toBeLessThan(9);
    }
  });

  it('lands the target segment under the fixed 12-o’clock pointer', () => {
    const segmentCount = 6;
    const segmentAngle = 360 / segmentCount;
    for (let targetIndex = 0; targetIndex < segmentCount; targetIndex++) {
      const rotation = computeTargetRotation(0, targetIndex, segmentCount);
      // Угол сегмента-мишени на экране после вращения: (исходный_угол + rotation) mod 360.
      const targetCenterOriginal = targetIndex * segmentAngle + segmentAngle / 2;
      const screenAngle = (((targetCenterOriginal + rotation) % 360) + 360) % 360;
      // Джиттер до ±30% ширины сегмента вокруг 0° (12 часов) — допуск чуть шире джиттера.
      const tolerance = segmentAngle * 0.35;
      const distanceFromZero = Math.min(screenAngle, 360 - screenAngle);
      expect(distanceFromZero).toBeLessThanOrEqual(tolerance);
    }
  });

  it('keeps spinning forward across repeated spins without snapping back', () => {
    let rotation = 0;
    for (let i = 0; i < 20; i++) {
      const idx = pickRandomSegmentIndex(8);
      const next = computeTargetRotation(rotation, idx, 8);
      expect(next).toBeGreaterThan(rotation);
      rotation = next;
    }
  });
});
