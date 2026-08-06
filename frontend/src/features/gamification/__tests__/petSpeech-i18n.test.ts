import { describe, it, expect } from "vitest";
import ru from "../../../i18n/locales/ru/translation.json";
import en from "../../../i18n/locales/en/translation.json";

const KEYS = ["replay", "close", "thanks"] as const;

describe("petSpeech i18n phrases", () => {
  it("RU содержит все ключи petSpeech с непустыми значениями", () => {
    const section = (ru as Record<string, Record<string, string>>).petSpeech;
    expect(section).toBeDefined();
    for (const key of KEYS) {
      expect(section[key]).toBeDefined();
      expect(section[key].trim().length).toBeGreaterThan(0);
    }
  });

  it("EN содержит все ключи petSpeech с непустыми значениями", () => {
    const section = (en as Record<string, Record<string, string>>).petSpeech;
    expect(section).toBeDefined();
    for (const key of KEYS) {
      expect(section[key]).toBeDefined();
      expect(section[key].trim().length).toBeGreaterThan(0);
    }
  });
});
