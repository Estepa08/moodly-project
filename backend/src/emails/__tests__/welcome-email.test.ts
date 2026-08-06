import { describe, it, expect } from "vitest";
import { welcomeEmailHtml, detectLang } from "../welcome-email.js";

describe("welcomeEmailHtml", () => {
  it("renders RU content by default", () => {
    const html = welcomeEmailHtml({ name: "Анна", lang: "ru" });
    expect(html).toContain("Анна, добро пожаловать в Moodly!");
    expect(html).toContain("Пройдите тест настроения");
    expect(html).toContain("Попробуйте дыхательную практику");
    expect(html).toContain("Выберите компаньона");
    expect(html).toContain("Включите напоминание");
    expect(html).toContain("Открыть Moodly");
  });

  it("renders EN content", () => {
    const html = welcomeEmailHtml({ name: "Anna", lang: "en" });
    expect(html).toContain("Anna, welcome to Moodly!");
    expect(html).toContain("Take the mood test");
    expect(html).toContain("Open Moodly");
  });
});

describe("detectLang", () => {
  it("detects ru from Accept-Language header", () => {
    expect(detectLang("ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(detectLang("ru")).toBe("ru");
    expect(detectLang("ru,en;q=0.9")).toBe("ru");
  });

  it("defaults to en", () => {
    expect(detectLang("en-US,en;q=0.9")).toBe("en");
    expect(detectLang(undefined)).toBe("en");
    expect(detectLang("de-DE,de;q=0.9")).toBe("en");
  });
});
