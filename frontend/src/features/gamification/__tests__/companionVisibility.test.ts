import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isCompanionHidden,
  setCompanionHidden,
  subscribeCompanionVisibility,
} from '../companionVisibility';

describe('companionVisibility', () => {
  beforeEach(() => {
    localStorage.clear();
    setCompanionHidden(false);
  });

  it('defaults to visible', () => {
    expect(isCompanionHidden()).toBe(false);
  });

  it('persists hidden state to localStorage', () => {
    setCompanionHidden(true);
    expect(isCompanionHidden()).toBe(true);
    expect(localStorage.getItem('moodly_hide_floating_companion')).toBe('1');
  });

  it('notifies subscribers on change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCompanionVisibility(listener);
    setCompanionHidden(true);
    expect(listener).toHaveBeenCalledTimes(1);
    setCompanionHidden(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setCompanionHidden(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
