import { describe, it, expect } from "vitest";
import { isSevereInterpretation } from "../useTestResultText";

describe("isSevereInterpretation", () => {
  it("returns true for interpretations starting with Severe", () => {
    expect(isSevereInterpretation("Severe depression")).toBe(true);
  });

  it("returns true for interpretations starting with Extreme", () => {
    expect(isSevereInterpretation("Extreme anxiety")).toBe(true);
  });

  it("returns false for mild/moderate interpretations", () => {
    expect(isSevereInterpretation("Mild symptoms")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isSevereInterpretation("")).toBe(false);
  });
});
