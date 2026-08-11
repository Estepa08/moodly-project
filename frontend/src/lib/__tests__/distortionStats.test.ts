import { describe, it, expect } from "vitest";
import { computeDistortionStats } from "../distortionStats";
import { DistortionKey } from "../distortionsQuiz";
import type { DecryptedEntry } from "../../hooks/useEntries";

function makeEntry(
  id: string,
  parameterId: string,
  value: number,
  createdAt: string,
  distortions?: DistortionKey[],
): DecryptedEntry {
  return {
    id,
    userId: "u1",
    parameterId,
    value,
    note: null,
    activities: [],
    distortions,
    createdAt,
  };
}

const mood = "p-mood";
const paramIds: Record<string, string> = { [mood]: "Mood" };
const paramNameById = (id: string) => paramIds[id];

describe("computeDistortionStats", () => {
  it("returns sufficient=false when no entries carry distortion tags", () => {
    const entries = [
      makeEntry("a", mood, 6, "2026-07-01T10:00:00.000Z"),
      makeEntry("b", mood, 7, "2026-07-02T10:00:00.000Z"),
    ];
    const result = computeDistortionStats(entries, paramNameById);
    expect(result.sufficient).toBe(false);
    expect(result.baseline).toBe(6.5);
  });

  it("counts distortion tags and computes mood delta vs baseline", () => {
    const entries = [
      makeEntry("a", mood, 6, "2026-07-01T10:00:00.000Z"),
      makeEntry("b", mood, 7, "2026-07-02T10:00:00.000Z"),
      makeEntry("c", mood, 8, "2026-07-03T10:00:00.000Z"),
      // Дни с #Катастрофизация: 3 и 4 → среднее 3.5 (delta -2.1 vs baseline 5.6)
      makeEntry("d", mood, 3, "2026-07-04T10:00:00.000Z", [DistortionKey.Magnification]),
      makeEntry("e", mood, 4, "2026-07-05T10:00:00.000Z", [
        DistortionKey.Magnification,
        DistortionKey.AllOrNothing,
      ]),
      // Повтор тега в тот же день не удваивает счётчик
      makeEntry("f", mood, 4, "2026-07-05T18:00:00.000Z", [DistortionKey.Magnification]),
    ];
    const result = computeDistortionStats(entries, paramNameById);
    expect(result.sufficient).toBe(true);
    expect(result.baseline).toBe(5.6);

    const mag = result.stats.find((s) => s.key === DistortionKey.Magnification)!;
    expect(mag.count).toBe(2); // 4 июля и 5 июля
    expect(mag.avgMood).toBe(3.5);
    expect(mag.moodDelta).toBeCloseTo(-2.1);

    const allOrNothing = result.stats.find((s) => s.key === DistortionKey.AllOrNothing)!;
    expect(allOrNothing.count).toBe(1);
    expect(allOrNothing.avgMood).toBe(4);
  });

  it("sorts stats by count descending", () => {
    const entries = [
      makeEntry("a", mood, 5, "2026-07-01T10:00:00.000Z", [
        DistortionKey.Magnification,
        DistortionKey.Magnification,
        DistortionKey.AllOrNothing,
        DistortionKey.Labeling,
      ]),
      makeEntry("b", mood, 6, "2026-07-02T10:00:00.000Z", [
        DistortionKey.Magnification,
        DistortionKey.AllOrNothing,
      ]),
    ];
    const result = computeDistortionStats(entries, paramNameById);
    expect(result.stats[0].count).toBe(2);
    expect(result.stats[1].count).toBe(2);
    expect(result.stats[2].count).toBe(1);
    // При равном count первым идёт ключ, раньше стоящий в DISTORTION_KEYS.
    expect(result.stats[0].key).toBe(DistortionKey.AllOrNothing);
    expect(result.stats[1].key).toBe(DistortionKey.Magnification);
  });

  it("skips distortions with zero mood data (avgMood null)", () => {
    const entries = [
      makeEntry("a", mood, 5, "2026-07-01T10:00:00.000Z"),
      // Тег на записи в день без записи Mood
      makeEntry("b", "p-other", 0, "2026-07-02T10:00:00.000Z", [DistortionKey.ShouldStatements]),
    ];
    paramIds["p-other"] = "Anxiety";
    const result = computeDistortionStats(entries, paramNameById);
    const stat = result.stats.find((s) => s.key === DistortionKey.ShouldStatements)!;
    expect(stat.count).toBe(1);
    expect(stat.avgMood).toBeNull();
    expect(stat.moodDelta).toBeNull();
  });
});
