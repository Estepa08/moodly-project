import { useState, useMemo, useCallback, useEffect } from 'react';
import { useEntries } from './useEntries';
import { roundDownToMinute } from '../lib/utils';
import { safeSessionStorage } from '../lib/safeStorage';

const LOW_THRESHOLD = 3;
const CONSECUTIVE_DAYS = 3;
const LOOKBACK_DAYS = 7;
const DEBOUNCE_MS = 3000;

const SESSION_KEY = 'moodly_low_mood_shown';

function isSessionShown(): boolean {
  return safeSessionStorage.getItem(SESSION_KEY) === '1';
}

function markSessionShown() {
  safeSessionStorage.setItem(SESSION_KEY, '1');
}

export function useLowMoodDetection() {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  const now = useMemo(() => roundDownToMinute(new Date()), []);
  const from = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - LOOKBACK_DAYS);
    return d.toISOString();
  }, [now]);

  const { data: entries, isLoading } = useEntries({ from, to: now.toISOString() });

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setReady(true), DEBOUNCE_MS);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const detected = useMemo(() => {
    if (!entries || entries.length === 0) return false;
    if (!ready) return false;
    if (dismissed) return false;
    if (isSessionShown()) return false;

    const byDate = new Map<string, number[]>();
    for (const e of entries) {
      const day = e.createdAt.slice(0, 10);
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day)!.push(e.value);
    }

    const dailyAvgs: { date: string; avg: number }[] = [];
    for (const [date, values] of byDate) {
      const sum = values.reduce((a, b) => a + b, 0);
      dailyAvgs.push({ date, avg: sum / values.length });
    }
    dailyAvgs.sort((a, b) => a.date.localeCompare(b.date));

    let streak = 0;
    for (const day of dailyAvgs) {
      if (day.avg <= LOW_THRESHOLD) {
        streak++;
        if (streak >= CONSECUTIVE_DAYS) return true;
      } else {
        streak = 0;
      }
    }

    return false;
  }, [entries, ready, dismissed]);

  const acknowledge = useCallback(() => {
    markSessionShown();
    setDismissed(true);
  }, []);

  return { detected, acknowledge };
}
