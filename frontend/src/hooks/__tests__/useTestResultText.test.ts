import { describe, it, expect } from "vitest";
import { getCrisisSeverity, isSevereInterpretation } from "../useTestResultText";

describe("getCrisisSeverity", () => {
  it("returns 'critical' for recommendations starting with CRITICAL", () => {
    expect(getCrisisSeverity("CRITICAL: seek immediate help")).toBe("critical");
  });

  it("returns 'urgent' for recommendations starting with URGENT", () => {
    expect(getCrisisSeverity("URGENT: contact a professional soon")).toBe("urgent");
  });

  it("returns null for non-crisis recommendations", () => {
    expect(getCrisisSeverity("Keep monitoring.")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(getCrisisSeverity("")).toBeNull();
  });

  it("is case-sensitive and does not match lowercase prefixes", () => {
    expect(getCrisisSeverity("critical: seek immediate help")).toBeNull();
  });

  it("does not match CRITICAL or URGENT occurring mid-string", () => {
    expect(getCrisisSeverity("This is not CRITICAL right now")).toBeNull();
  });

  it("prioritizes 'critical' when a recommendation could arguably match both", () => {
    expect(getCrisisSeverity("CRITICAL and URGENT: act now")).toBe("critical");
  });
});

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
