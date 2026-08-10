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
    expect(result.up[0].days).toBeGreaterThanOrEqual(5);
  });

  it("deduplicates repeated activities within the same day", () => {
    const entries: DecryptedEntry[] = [];
    for (let d = 1; d <= 5; d++) {
      entries.push(makeEntry(d, mood, 9));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "run" }, { key: "run" }]));
    }
    for (let d = 6; d <= 7; d++) {
      entries.push(makeEntry(d, mood, 5));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.up.find((s) => s.key === "run")?.days).toBe(5);
  });

  it("uses custom label for custom activities", () => {
    const entries: DecryptedEntry[] = [];
    for (let d = 1; d <= 5; d++) {
      entries.push(makeEntry(d, mood, 8));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "custom:x", custom: true, label: "Ретрит" }]));
    }
    for (let d = 6; d <= 7; d++) {
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

describe("confidence and noise filtering", () => {
  it("excludes activities with n below MIN_ACTIVITY_DAYS even with large lift", () => {
    const entries: DecryptedEntry[] = [];
    // run: только 3 дня, но высокое значение показателя
    for (let d = 1; d <= 3; d++) {
      entries.push(makeEntry(d, mood, 9));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "run" }]));
    }
    // walk: 5 дней с низким значением — образует базлайн
    for (let d = 4; d <= 8; d++) {
      entries.push(makeEntry(d, mood, 5));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.sufficient).toBe(true);
    expect(result.up.find((s) => s.key === "run")).toBeUndefined();
    expect(result.down.find((s) => s.key === "run")).toBeUndefined();
    expect(result.down[0].key).toBe("walk");
  });

  it("n=5 with stable low spread gets confidence low (n<7 base, no upgrade)", () => {
    const entries: DecryptedEntry[] = [];
    for (let d = 1; d <= 5; d++) {
      entries.push(makeEntry(d, mood, 8));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    for (let d = 6; d <= 10; d++) {
      entries.push(makeEntry(d, mood, 4));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
    }
    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.up[0].key).toBe("walk");
    expect(result.up[0].days).toBe(5);
    expect(result.up[0].confidence).toBe("low");
  });

  it("confidence rises with daysCount: n=8 → medium, n=15 → high", () => {
    const medium: DecryptedEntry[] = [];
    for (let d = 1; d <= 8; d++) {
      medium.push(makeEntry(d, mood, 8));
      medium.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    for (let d = 9; d <= 14; d++) {
      medium.push(makeEntry(d, mood, 4));
      medium.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
    }
    const mediumRes = computeActivityCorrelation(medium, paramNameById, labelFor);
    expect(mediumRes.up[0].confidence).toBe("medium");

    const high: DecryptedEntry[] = [];
    for (let d = 1; d <= 15; d++) {
      high.push(makeEntry(d, mood, 8));
      high.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    for (let d = 16; d <= 30; d++) {
      high.push(makeEntry(d, mood, 4));
      high.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
    }
    const highRes = computeActivityCorrelation(high, paramNameById, labelFor);
    expect(highRes.up[0].confidence).toBe("high");
  });

  it("large spread downgrades confidence when signal is within noise", () => {
    // walk: 8 дней с чередованием 8/2 — среднее 5, разброс ~3, сигнал ~0.43
    const noisyMedium: DecryptedEntry[] = [];
    for (let d = 1; d <= 8; d++) {
      noisyMedium.push(makeEntry(d, mood, d % 2 === 1 ? 8 : 2));
      noisyMedium.push(makeEntry(d, dayAct, 0, [{ key: "walk" }]));
    }
    for (let d = 9; d <= 14; d++) {
      noisyMedium.push(makeEntry(d, mood, 4));
      noisyMedium.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
    }
    const res = computeActivityCorrelation(noisyMedium, paramNameById, labelFor);
    const walk = res.up.find((s) => s.key === "walk") ?? res.down.find((s) => s.key === "walk");
    expect(walk).toBeDefined();
    expect(walk!.confidence).toBe("low");

    // n=5 с большим разбросом тоже остаётся low (ниже опускаться некуда)
    const noisySmall: DecryptedEntry[] = [];
    for (let d = 1; d <= 5; d++) {
      noisySmall.push(makeEntry(d, mood, d % 2 === 1 ? 8 : 2));
      noisySmall.push(makeEntry(d, dayAct, 0, [{ key: "run" }]));
    }
    for (let d = 6; d <= 10; d++) {
      noisySmall.push(makeEntry(d, mood, 4));
      noisySmall.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
    }
    const smallRes = computeActivityCorrelation(noisySmall, paramNameById, labelFor);
    const run =
      smallRes.up.find((s) => s.key === "run") ?? smallRes.down.find((s) => s.key === "run");
    expect(run).toBeDefined();
    expect(run!.confidence).toBe("low");
  });

  it("prefers larger daysCount when lifts are equal", () => {
    const entries: DecryptedEntry[] = [];
    // walk и gym оба в дни с mood=8: gym чаще (n=10), walk реже (n=5)
    for (let d = 1; d <= 5; d++) {
      entries.push(makeEntry(d, mood, 8));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "gym" }, { key: "walk" }]));
    }
    for (let d = 6; d <= 10; d++) {
      entries.push(makeEntry(d, mood, 8));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "gym" }]));
    }
    for (let d = 11; d <= 15; d++) {
      entries.push(makeEntry(d, mood, 4));
      entries.push(makeEntry(d, dayAct, 0, [{ key: "stress" }]));
    }
    const result = computeActivityCorrelation(entries, paramNameById, labelFor);
    expect(result.up[0].key).toBe("gym");
    expect(result.up[1].key).toBe("walk");
    expect(result.up[0].lift).toBeCloseTo(result.up[1].lift);
    expect(result.up[0].days).toBeGreaterThan(result.up[1].days);
  });
});
