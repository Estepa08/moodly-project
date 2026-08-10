import { describe, it, expect } from "vitest";
import { parseLegacyActivities } from "../records";

describe("parseLegacyActivities", () => {
  it("parse a JSON array of activities from a legacy note", () => {
    const note = JSON.stringify([
      { key: "movement.walk" },
      { key: "custom:retreat", custom: true, label: "Ретрит" },
    ]);
    expect(parseLegacyActivities(note)).toEqual([
      { key: "movement.walk" },
      { key: "custom:retreat", custom: true, label: "Ретрит" },
    ]);
  });

  it("returns [] for plain text notes", () => {
    expect(parseLegacyActivities("Просто заметка")).toEqual([]);
    expect(parseLegacyActivities("noCaffeine,noScreens")).toEqual([]);
    expect(parseLegacyActivities("3/7")).toEqual([]);
  });

  it("returns [] for null and empty strings", () => {
    expect(parseLegacyActivities(null)).toEqual([]);
    expect(parseLegacyActivities("")).toEqual([]);
    expect(parseLegacyActivities("   ")).toEqual([]);
  });

  it("ignores malformed JSON and non-array values", () => {
    expect(parseLegacyActivities('[{"key":')).toEqual([]);
    expect(parseLegacyActivities('{"a":1}')).toEqual([]);
  });

  it("filters out objects without a string key", () => {
    expect(parseLegacyActivities('[{"key":"a"},{"label":"no-key"},{"key":"b"}]')).toEqual([
      { key: "a" },
      { key: "b" },
    ]);
  });
});
