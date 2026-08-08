import { describe, it, expect } from "vitest";
import {
  computeActivityCorrelation,
  computeMetricCorrelation,
  computeAllMetricCorrelations,
  type CorrelationMetric,
} from "../activityCorrelation";
import type { DecryptedEntry } from "../../hooks/useEntries";
import type { ActivitySelection } from "../crypto/records";

function makeEntry(
  day: number,
  parameterId: string,
  value: number,
  activities?: ActivitySelection[],
): DecryptedEntry {
  return {
    id: `id-${day}-${parameterId}-${value}`,
    userId: "u1",
    parameterId,
    value,
    note: null,
    activities: activities ?? [],
    createdAt: `2026-07-${String(day).padStart(2, "0")}T12:00:00.000Z`,
  };
}

const mood = "p-mood";
const sleep = "p-sleep";
const energy = "p-energy";
const anxiety = "p-anxiety";
const dayAct = "p-day";

const paramIds: Record<string, string> = {
  [mood]: "Mood",
  [sleep]: "Sleep",
  [energy]: "Energy",
  [anxiety]: "Anxiety",
  [dayAct]: "Day Activities",
};

const paramNameById = (id: string) => paramIds[id];
const labelFor = (key: string, customLabel?: string) => customLabel ?? `label:${key}`;

function daysWithMetric(
  metricParam: string,
  value: number,
  from: number,
  to: number,
): DecryptedEntry[] {
  const entries: DecryptedEntry[] = [];
  for (let d = from; d <= to; d++) {
    entries.push(makeEntry(d, metricParam, value));
    entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
  }
  return entries;
}

describe("computeActivityCorrelation", () => {
  it("returns sufficient=false when too few days with both mood and activities", () => {
    const entries = [
      makeEntry(1, mood, 6),
      makeEntry(1, dayAct, 0, [{ key: "walk" }]),
      makeEntry(2, mood, 7),
    ];
    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.sufficient).toBe(false);
  });

  it("computes baseline and top up/down activities for mood", () => {
    const entries: DecryptedEntry[] = [];
    // walk: consistently high mood
    for (let d = 1; d <= 5; d++) {
      entries.push(makeEntry(d, mood, 8 + (d % 2)));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    // stress: consistently low mood
    for (let d = 6; d <= 10; d++) {
      entries.push(makeEntry(d, mood, 3 + (d % 2)));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
    }
    // neutral: gym mid
    for (let d = 1; d <= 10; d += 2) {
      entries.push(makeEntry(d, dayAct, 0, [{ key: "gym" }]));
    }

    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.sufficient).toBe(true);
    expect(result.up[0].key).toBe("walk");
    expect(result.down[0].key).toBe("stress");
    expect(result.up[0].lift).toBeGreaterThan(0);
    expect(result.down[0].lift).toBeLessThan(0);
    expect(result.up[0].days).toBeGreaterThanOrEqual(3);
  });

  it("deduplicates repeated activities within the same day", () => {
    const entries: DecryptedEntry[] = [];
    for (let d = 1; d <= 4; d++) {
      entries.push(makeEntry(d, mood, 9));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "run" }, { key: "run" }]));
    }
    for (let d = 5; d <= 6; d++) {
      entries.push(makeEntry(d, mood, 5));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.up.find((s) => s.key === "run")?.days).toBe(4);
  });

  it("uses custom label for custom activities", () => {
    const entries: DecryptedEntry[] = [];
    for (let d = 1; d <= 4; d++) {
      entries.push(makeEntry(d, mood, 8));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "custom:x", custom: true, label: "Ретрит" }]));
    }
    for (let d = 5; d <= 6; d++) {
      entries.push(makeEntry(d, mood, 5));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.up[0].label).toBe("Ретрит");
  });
});

describe("computeMetricCorrelation — sleep/energy/anxiety", () => {
  const expectations: { metric: CorrelationMetric; good: boolean }[] = [
    { metric: "sleep", good: true },
    { metric: "energy", good: true },
    // anxiety выше = хуже, поэтому после нормализации «walk» даёт высокое значение
    { metric: "anxiety", good: true },
  ];

  it.each(expectations)(
    "correlates $metric with activities and returns top up/down",
    ({ metric }) => {
      const metricParam = metric === "sleep" ? sleep : metric === "energy" ? energy : anxiety;
      const entries: DecryptedEntry[] = [];
      // walk: high value days -> should be "up"
      const highValue = metric === "anxiety" ? 2 : 8;
      const lowValue = metric === "anxiety" ? 8 : 2;
      for (let d = 1; d <= 5; d++) {
        entries.push(makeEntry(d, metricParam, highValue));
        entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
      }
      // stress: low value days -> should be "down"
      for (let d = 6; d <= 10; d++) {
        entries.push(makeEntry(d, metricParam, lowValue));
        entries.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
      }

      const result = computeMetricCorrelation(entries, paramNameById, labelFor, metric);
      expect(result.sufficient).toBe(true);
      expect(result.metric).toBe(metric);
      expect(result.up[0].key).toBe("walk");
      expect(result.down[0].key).toBe("stress");
    },
  );

  it("isolation: sleep days do not feed mood correlation", () => {
    const entries = daysWithMetric(sleep, 9, 1, 4);
    const result = computeMetricCorrelation(entries, paramNameById, labelFor, "mood");
    expect(result.sufficient).toBe(false);
    expect(result.daysTracked).toBe(0);
  });

  it("reports daysTracked behind sufficient=false when few days", () => {
    const entries = daysWithMetric(mood, 7, 1, 2);
    const result = computeMetricCorrelation(entries, paramNameById, labelFor, "mood");
    expect(result.sufficient).toBe(false);
    expect(result.daysTracked).toBe(2);
  });
});

describe("computeAllMetricCorrelations", () => {
  it("returns a row for every supported metric", () => {
    const entries: DecryptedEntry[] = [];
    for (let d = 1; d <= 5; d++) {
      entries.push(makeEntry(d, mood, 8));
      entries.push(makeEntry(d, sleep, 7));
      entries.push(makeEntry(d, energy, 6));
      entries.push(makeEntry(d, anxiety, 4));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    const all = computeAllMetricCorrelations(entries, paramNameById, labelFor);
    expect(Object.keys(all).sort()).toEqual(["anxiety", "energy", "mood", "sleep"]);
    for (const metric of Object.keys(all) as CorrelationMetric[]) {
      expect(all[metric].sufficient).toBe(true);
      expect(all[metric].daysTracked).toBe(5);
    }
  });
});
