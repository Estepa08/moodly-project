import { describe, it, expect } from "vitest";
import { computeActivityCorrelation } from "../activityCorrelation";
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
const dayAct = "p-day";
const paramNameById = (id: string) =>
  id === mood ? "Mood" : id === dayAct ? "Day Activities" : undefined;
const labelFor = (key: string, customLabel?: string) => customLabel ?? `label:${key}`;

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

  it("computes baseline and top up/down activities", () => {
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
