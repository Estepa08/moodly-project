import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdleLogout } from '../useIdleLogout';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

describe('useIdleLogout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('вызывает onIdle после истечения таймаута без активности', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLogout(onIdle, IDLE_TIMEOUT_MS));

    act(() => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 60_000);
    });

    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('не вызывает onIdle, пока активность сбрасывает таймер', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLogout(onIdle, IDLE_TIMEOUT_MS));

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
      window.dispatchEvent(new Event('mousemove'));
      vi.advanceTimersByTime(5 * 60 * 1000);
      window.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(onIdle).not.toHaveBeenCalled();
  });

  it('срабатывает при возврате во вкладку, если лимит превышен (visibilitychange)', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLogout(onIdle, IDLE_TIMEOUT_MS));

    act(() => {
      vi.advanceTimersByTime(9 * 60 * 1000);
    });
    expect(onIdle).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MS);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('вызывает onIdle только один раз после таймаута', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleLogout(onIdle, IDLE_TIMEOUT_MS));

    act(() => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MS * 2);
    });

    expect(onIdle).toHaveBeenCalledTimes(1);
  });
});
