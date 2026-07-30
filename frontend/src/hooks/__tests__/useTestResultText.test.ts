import { describe, it, expect } from "vitest";
import { isSevereInterpretation } from "../useTestResultText";

describe("isSevereInterpretation", () => {
  it("returns true for bandKey 'severe'", () => {
    expect(isSevereInterpretation("any", { bandKey: "severe" })).toBe(true);
  });

  it("returns true for bandKey 'extreme'", () => {
    expect(isSevereInterpretation("any", { bandKey: "extreme" })).toBe(true);
  });

  it("returns true for bandKey 'high'", () => {
    expect(isSevereInterpretation("any", { bandKey: "high" })).toBe(true);
  });

  it("returns false for mild/moderate bandKeys", () => {
    expect(isSevereInterpretation("any", { bandKey: "mild" })).toBe(false);
  });

  it("returns false for an empty flags object", () => {
    expect(isSevereInterpretation("any", {})).toBe(false);
  });

  it("returns false when flags is undefined", () => {
    expect(isSevereInterpretation("any", undefined)).toBe(false);
  });
});
