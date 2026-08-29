import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isSeasonalParticlesHidden,
  setSeasonalParticlesHidden,
  subscribeSeasonalParticlesVisibility,
} from '../seasonalParticlesVisibility';

describe('seasonalParticlesVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    setSeasonalParticlesHidden(false);
  });

  it('defaults to visible', () => {
    expect(isSeasonalParticlesHidden()).toBe(false);
  });

  it('persists hidden state to localStorage', () => {
    setSeasonalParticlesHidden(true);
    expect(isSeasonalParticlesHidden()).toBe(true);
    expect(localStorage.getItem('moodly_hide_seasonal_particles')).toBe('1');
  });

  it('does not persist the default (visible) state', () => {
    setSeasonalParticlesHidden(true);
    setSeasonalParticlesHidden(false);
    expect(localStorage.getItem('moodly_hide_seasonal_particles')).toBeNull();
  });

  it('notifies subscribers on change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSeasonalParticlesVisibility(listener);
    setSeasonalParticlesHidden(true);
    expect(listener).toHaveBeenCalledTimes(1);
    setSeasonalParticlesHidden(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setSeasonalParticlesHidden(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
