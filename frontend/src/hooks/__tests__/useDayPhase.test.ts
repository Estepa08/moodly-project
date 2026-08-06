import { describe, it, expect } from "vitest";
import { getDayPhase } from "../useDayPhase";

describe("getDayPhase", () => {
  it("возвращает morning для 5–13 часов", () => {
    for (let h = 5; h <= 13; h++) {
      expect(getDayPhase(h)).toBe("morning");
    }
  });

  it("возвращает day для 14–19 часов", () => {
    for (let h = 14; h <= 19; h++) {
      expect(getDayPhase(h)).toBe("day");
    }
  });

  it("возвращает evening для 20–23 и 0–4 часов", () => {
    for (let h = 20; h <= 23; h++) {
      expect(getDayPhase(h)).toBe("evening");
    }
    for (let h = 0; h <= 4; h++) {
      expect(getDayPhase(h)).toBe("evening");
    }
  });

  it("граничные часы: 5 и 14 и 20 переключают фазы корректно", () => {
    expect(getDayPhase(5)).toBe("morning");
    expect(getDayPhase(14)).toBe("day");
    expect(getDayPhase(20)).toBe("evening");
  });
});
