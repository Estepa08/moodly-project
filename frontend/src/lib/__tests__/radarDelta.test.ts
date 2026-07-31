import { describe, expect, it } from "vitest";
import { DistortionKey } from "../distortionsQuiz";
import {
  buildRadarComparison,
  distortionDelta,
  getDistortions,
  hasDistortionsFlags,
} from "../radarDelta";

const cdResult = (completedAt: string, distortions: Partial<Record<DistortionKey, number>>) => ({
  completedAt,
  flags: {
    distortions: Object.fromEntries(
      Object.entries(distortions).map(([key, score]) => [key, { score }]),
    ),
  },
});

const plainResult = (completedAt: string) => ({ completedAt, flags: { templateKey: "x" } });

describe("hasDistortionsFlags", () => {
  it("возвращает true только для результатов с флагом distortions", () => {
    expect(hasDistortionsFlags(cdResult("2026-01-01", { allOrNothing: 5 }))).toBe(true);
    expect(hasDistortionsFlags(plainResult("2026-01-01"))).toBe(false);
    expect(hasDistortionsFlags({ completedAt: "2026-01-01", flags: null })).toBe(false);
  });
});

describe("getDistortions", () => {
  it("преобразует flags.distortions в список записей", () => {
    const result = cdResult("2026-01-01", { allOrNothing: 5, labeling: 7 });
    expect(getDistortions(result)).toEqual([
      { key: DistortionKey.AllOrNothing, score: 5 },
      { key: DistortionKey.Labeling, score: 7 },
    ]);
  });

  it("возвращает пустой массив без флага distortions", () => {
    expect(getDistortions(plainResult("2026-01-01"))).toEqual([]);
  });
});

describe("buildRadarComparison", () => {
  it("возвращает null без результатов", () => {
    expect(buildRadarComparison(null)).toBeNull();
    expect(buildRadarComparison([])).toBeNull();
  });

  it("возвращает null, если CD-результатов нет", () => {
    expect(buildRadarComparison([plainResult("2026-01-01")])).toBeNull();
  });

  it("с одним результатом возвращает current без previous", () => {
    const comparison = buildRadarComparison([
      cdResult("2026-01-01", { allOrNothing: 5 }),
    ]);
    expect(comparison).not.toBeNull();
    expect(comparison!.previous).toBeNull();
    expect(comparison!.previousDate).toBeNull();
    expect(comparison!.currentDate).toBe("2026-01-01");
    expect(comparison!.current).toEqual([{ key: DistortionKey.AllOrNothing, score: 5 }]);
  });

  it("с двумя результатами берёт последний как current и предыдущий как previous по дате", () => {
    const comparison = buildRadarComparison([
      cdResult("2026-02-01", { allOrNothing: 7, labeling: 8 }),
      cdResult("2026-01-01", { allOrNothing: 5, labeling: 4 }),
    ]);
    expect(comparison!.currentDate).toBe("2026-02-01");
    expect(comparison!.previousDate).toBe("2026-01-01");
    expect(comparison!.previous).toEqual([
      { key: DistortionKey.AllOrNothing, score: 5 },
      { key: DistortionKey.Labeling, score: 4 },
    ]);
  });

  it("с тремя результатами сравнивает два последних прохождения", () => {
    const comparison = buildRadarComparison([
      cdResult("2026-01-01", { allOrNothing: 2 }),
      cdResult("2026-03-01", { allOrNothing: 9 }),
      cdResult("2026-02-01", { allOrNothing: 4 }),
    ]);
    expect(comparison!.current).toEqual([{ key: DistortionKey.AllOrNothing, score: 9 }]);
    expect(comparison!.previous).toEqual([{ key: DistortionKey.AllOrNothing, score: 4 }]);
    expect(comparison!.currentDate).toBe("2026-03-01");
    expect(comparison!.previousDate).toBe("2026-02-01");
  });

  it("возвращает null, если текущий результат без данных distortions", () => {
    expect(
      buildRadarComparison([cdResult("2026-01-01", {})]),
    ).toBeNull();
  });
});

describe("distortionDelta", () => {
  const previous = [
    { key: DistortionKey.AllOrNothing, score: 5 },
    { key: DistortionKey.Labeling, score: 4 },
  ];
  const current = [
    { key: DistortionKey.AllOrNothing, score: 3 },
    { key: DistortionKey.Labeling, score: 9 },
    { key: DistortionKey.Personalization, score: 4 },
  ];

  it("вычисляет разницу current − previous", () => {
    expect(distortionDelta(previous, current, DistortionKey.AllOrNothing)).toBe(-2);
    expect(distortionDelta(previous, current, DistortionKey.Labeling)).toBe(5);
  });

  it("возвращает null без previous", () => {
    expect(distortionDelta(null, current, DistortionKey.AllOrNothing)).toBeNull();
  });

  it("возвращает null, если ключ отсутствует в одном из наборов", () => {
    expect(distortionDelta(previous, current, DistortionKey.MentalFilter)).toBeNull();
  });
});
