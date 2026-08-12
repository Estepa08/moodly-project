import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildRewardSignal,
  computeEmpathy,
  pickPetWordIndex,
  EMPATHY_WINDOW_MS,
} from "../petRewards";
import type { PetResponse } from "../../../lib/api";

function makeResponse(partial: Partial<PetResponse> = {}): PetResponse {
  return {
    state: {} as PetResponse["state"],
    leveledUp: false,
    xpAwarded: 0,
    petCount: 1,
    petCountRemaining: 29,
    limitReached: false,
    ...partial,
  };
}

describe("buildRewardSignal", () => {
  it("возвращает стандартный вид при +1 XP без скрытых бонусов", () => {
    const signal = buildRewardSignal(
      makeResponse({
        xpAwarded: 1,
        bonus: {
          morning: false,
          evening: false,
          welcome: false,
          empathy: false,
          comboCount: 1,
          comboBonusAwarded: false,
          calmnessGain: 0,
          comfortGain: 0,
        },
      }),
    );
    expect(signal.kind).toBe("standard");
    expect(signal.xpText).toBe("+1 XP");
  });

  it("welcome перекрывает morning/evening/standard", () => {
    const signal = buildRewardSignal(
      makeResponse({
        xpAwarded: 2,
        bonus: {
          morning: true,
          evening: false,
          welcome: true,
          empathy: false,
          comboCount: 1,
          comboBonusAwarded: false,
          calmnessGain: 0,
          comfortGain: 0,
        },
      }),
    );
    expect(signal.kind).toBe("welcome");
  });

  it("combo перекрывает morning (приоритет выше)", () => {
    const signal = buildRewardSignal(
      makeResponse({
        xpAwarded: 5,
        bonus: {
          morning: true,
          evening: false,
          welcome: false,
          empathy: false,
          comboCount: 5,
          comboBonusAwarded: true,
          calmnessGain: 0,
          comfortGain: 0,
        },
      }),
    );
    expect(signal.kind).toBe("combo");
    expect(signal.comboBonusAwarded).toBe(true);
    expect(signal.comboCount).toBe(5);
  });

  it("evening — бонус вечера без XP на 3-м клике", () => {
    const signal = buildRewardSignal(
      makeResponse({
        xpAwarded: 0,
        bonus: {
          morning: false,
          evening: true,
          welcome: false,
          empathy: false,
          comboCount: 2,
          comboBonusAwarded: false,
          calmnessGain: 1,
          comfortGain: 0,
        },
      }),
    );
    expect(signal.kind).toBe("evening");
    expect(signal.calmnessGain).toBe(1);
    expect(signal.xpText).toBeUndefined();
  });

  it("эмпатия ниже комбо, но выше стандартного", () => {
    const signal = buildRewardSignal(
      makeResponse({
        xpAwarded: 1,
        bonus: {
          morning: false,
          evening: false,
          welcome: false,
          empathy: true,
          comboCount: 2,
          comboBonusAwarded: false,
          calmnessGain: 0,
          comfortGain: 2,
        },
      }),
    );
    expect(signal.kind).toBe("empathy");
    expect(signal.comfortGain).toBe(2);
  });

  it("клик без XP и без бонусов → none (нужен счётчик комбо)", () => {
    const signal = buildRewardSignal(
      makeResponse({
        xpAwarded: 0,
        bonus: {
          morning: false,
          evening: false,
          welcome: false,
          empathy: false,
          comboCount: 3,
          comboBonusAwarded: false,
          calmnessGain: 0,
          comfortGain: 0,
        },
      }),
    );
    expect(signal.kind).toBe("none");
    expect(signal.comboCount).toBe(3);
  });

  it("генерирует уникальный id для каждого сигнала", () => {
    const a = buildRewardSignal(makeResponse());
    const b = buildRewardSignal(makeResponse());
    expect(a.id).not.toBe(b.id);
  });
});

describe("pickPetWordIndex", () => {
  afterEach(() => vi.restoreAllMocks());

  it("пул из 1 слова → всегда 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(pickPetWordIndex(1, null)).toBe(0);
    expect(pickPetWordIndex(1, 0)).toBe(0);
  });

  it("не повторяет предыдущий индекс (сдвиг на +1)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01); // floor(0.01 * 4) = 0
    expect(pickPetWordIndex(4, null)).toBe(0);
    expect(pickPetWordIndex(4, 0)).toBe(1); // тот же рандом → ушли на следующий
  });

  it("возвращает индекс в границах пула", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(pickPetWordIndex(14, null)).toBeLessThan(14);
    expect(pickPetWordIndex(14, null)).toBeGreaterThanOrEqual(0);
  });
});

describe("computeEmpathy", () => {
  afterEach(() => vi.useRealTimers());

  const moodId = "cm-mood";
  const anxietyId = "cm-anxiety";

  function entry(parameterId: string, value: number, hoursAgo: number) {
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
    return { parameterId, value, createdAt };
  }

  it("грустная запись Mood (≤ 3) за 24ч → true", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T15:00:00Z"));
    const entries = [entry(moodId, 3, 2)];
    expect(computeEmpathy(moodId, anxietyId, entries)).toBe(true);
  });

  it("позитивная запись Mood (> 3) → false", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T15:00:00Z"));
    const entries = [entry(moodId, 7, 1)];
    expect(computeEmpathy(moodId, anxietyId, entries)).toBe(false);
  });

  it("любая запись Anxiety за 24ч → true (тревога)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T15:00:00Z"));
    const entries = [entry(anxietyId, 6, 3)];
    expect(computeEmpathy(moodId, anxietyId, entries)).toBe(true);
  });

  it("записи старше 24ч игнорируются", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T15:00:00Z"));
    const justOut = new Date(Date.now() - (EMPATHY_WINDOW_MS + 60 * 1000)).toISOString();
    const entries = [{ parameterId: moodId, value: 2, createdAt: justOut }];
    expect(computeEmpathy(moodId, anxietyId, entries)).toBe(false);
  });

  it("нет записей → false", () => {
    expect(computeEmpathy(moodId, anxietyId, undefined)).toBe(false);
    expect(computeEmpathy(moodId, anxietyId, [])).toBe(false);
  });

  it("неизвестный параметр игнорируется", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T15:00:00Z"));
    const entries = [{ parameterId: "cm-other", value: 1, createdAt: new Date().toISOString() }];
    expect(computeEmpathy(moodId, anxietyId, entries)).toBe(false);
  });
});
