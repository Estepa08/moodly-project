import type { ActivitySelection } from "./crypto/records";

export interface HistoryActivity {
  key: string;
  count: number;
  label?: string;
  custom?: boolean;
}

function activityId(s: ActivitySelection): string {
  return s.key;
}

export function aggregateHistory(
  entries: { createdAt: string; activities?: ActivitySelection[] }[],
) {
  const freq = new Map<string, { key: string; count: number; label?: string; custom?: boolean }>();
  const dayKeys = new Set<string>();

  for (const e of entries) {
    const day = new Date(e.createdAt ?? Date.now());
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    dayKeys.add(key);
    for (const a of e.activities ?? []) {
      const id = activityId(a);
      const cur = freq.get(id);
      if (cur) {
        cur.count += 1;
      } else {
        freq.set(id, { key: id, count: 1, label: a.label, custom: a.custom });
      }
    }
  }

  const byFrequency = Array.from(freq.values())
    .sort((a, b) => b.count - a.count)
    .map((f) => ({ key: f.key, count: f.count, label: f.label, custom: f.custom }));

  return { byFrequency, dayCount: dayKeys.size };
}

export function pickFrequent(
  entries: { createdAt: string; activities?: ActivitySelection[] }[],
  limit = 6,
): HistoryActivity[] {
  return aggregateHistory(entries).byFrequency.slice(0, limit);
}

export function latestDayActivities(
  entries: { createdAt: string; activities?: ActivitySelection[] }[],
): ActivitySelection[] {
  let latest: ActivitySelection[] | null = null;
  let latestTime = -Infinity;
  for (const e of entries) {
    const t = new Date(e.createdAt ?? 0).getTime();
    if (t > latestTime) {
      latestTime = t;
      latest = e.activities ?? [];
    }
  }
  return latest ?? [];
}
