import { describe, it, expect } from "vitest";
import { isNetworkError, ApiError } from "../api-error";

describe("isNetworkError", () => {
  it("возвращает true для TypeError от fetch (ERR_CONNECTION_REFUSED)", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("возвращает true для TypeError с network-сообщением", () => {
    expect(isNetworkError(new TypeError("NetworkError when attempting to fetch resource"))).toBe(
      true,
    );
  });

  it("возвращает false для ApiError от HTTP-статуса", () => {
    expect(isNetworkError(new ApiError("VALIDATION", "Bad request"))).toBe(false);
  });

  it("возвращает false для произвольных ошибок", () => {
    expect(isNetworkError(new Error("boom"))).toBe(false);
    expect(isNetworkError("string")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
