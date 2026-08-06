import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isSpeechBubbleHidden,
  setSpeechBubbleHidden,
  subscribeSpeechBubbleVisibility,
} from "../speechBubbleVisibility";

describe("speechBubbleVisibility", () => {
  beforeEach(() => {
    localStorage.clear();
    setSpeechBubbleHidden(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("по умолчанию пузырь виден", () => {
    expect(isSpeechBubbleHidden()).toBe(false);
  });

  it("скрытие сохраняется в localStorage", () => {
    setSpeechBubbleHidden(true);
    expect(isSpeechBubbleHidden()).toBe(true);
    expect(localStorage.getItem("moodly_hide_speech_bubble")).toBe("1");
  });

  it("возврат к показу убирает флаг", () => {
    setSpeechBubbleHidden(true);
    setSpeechBubbleHidden(false);
    expect(isSpeechBubbleHidden()).toBe(false);
    expect(localStorage.getItem("moodly_hide_speech_bubble")).toBeNull();
  });

  it("уведомляет подписчиков об изменениях и возвращает отписку", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSpeechBubbleVisibility(listener);

    setSpeechBubbleHidden(true);
    setSpeechBubbleHidden(false);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setSpeechBubbleHidden(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
