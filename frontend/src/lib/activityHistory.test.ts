import { describe, expect, it } from "vitest";
import { aggregateHistory, pickFrequent, latestDayActivities } from "./activityHistory";

const day = (offsetDays: number, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

describe("aggregateHistory", () => {
  it("считает частоту занятий и число уникальных дней", () => {
    const entries = [
      { createdAt: day(2), activities: [{ key: "walk" }, { key: "coffee" }] },
      { createdAt: day(1), activities: [{ key: "walk" }, { key: "read" }] },
      { createdAt: day(0), activities: [{ key: "walk" }] },
    ];
    const res = aggregateHistory(entries);
    expect(res.dayCount).toBe(3);
    const walk = res.byFrequency.find((f) => f.key === "walk");
    expect(walk?.count).toBe(3);
  });

  it("учитывает custom-занятия с ярлыком", () => {
    const res = aggregateHistory([
      {
        createdAt: day(0),
        activities: [{ key: "custom:1", custom: true, label: "Медитация" }],
      },
    ]);
    expect(res.byFrequency[0]).toMatchObject({ key: "custom:1", label: "Медитация", custom: true });
  });

  it("сортирует по убыванию частоты", () => {
    const res = aggregateHistory([
      { createdAt: day(0), activities: [{ key: "a" }, { key: "b" }, { key: "a" }] },
    ]);
    expect(res.byFrequency.map((f) => f.key)).toEqual(["a", "b"]);
  });
});

describe("pickFrequent", () => {
  it("возвращает топ-N по частоте", () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({
      createdAt: day(i),
      activities: [{ key: `k${i}` }],
    }));
    const top = pickFrequent(entries, 3);
    expect(top.length).toBe(3);
  });
});

describe("latestDayActivities", () => {
  it("возвращает занятия самого свежего дня", () => {
    const entries = [
      { createdAt: day(2), activities: [{ key: "old" }] },
      { createdAt: day(0, 20), activities: [{ key: "newest" }] },
    ];
    expect(latestDayActivities(entries)).toEqual([{ key: "newest" }]);
  });

  it("возвращает пустой массив при отсутствии записей", () => {
    expect(latestDayActivities([])).toEqual([]);
  });
});
