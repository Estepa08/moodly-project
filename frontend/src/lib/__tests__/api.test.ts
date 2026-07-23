import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { api, setToken, getToken } from "../api";

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("api request / 401 refresh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
    setToken(null);
  });

  it("attaches the bearer token and returns data on a successful request", async () => {
    setToken("initial-token");
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(200, { id: "1", title: "GAD-7" }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.tests.get("1");

    expect(result).toEqual({ id: "1", title: "GAD-7" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer initial-token");
  });

  it("on a 401, refreshes the token once and retries the original request", async () => {
    setToken("expired-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "unauthorized" })) // original request
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: "fresh-token" })) // /auth/refresh
      .mockResolvedValueOnce(jsonResponse(200, { id: "1", title: "GAD-7" })); // retried request
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.tests.get("1");

    expect(result).toEqual({ id: "1", title: "GAD-7" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    const retryInit = fetchMock.mock.calls[2][1];
    expect(retryInit.headers.Authorization).toBe("Bearer fresh-token");
    expect(getToken()).toBe("fresh-token");
  });

  it("on a 401 with a failed refresh, clears the token and throws instead of retrying", async () => {
    setToken("expired-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "unauthorized" })) // original request
      .mockResolvedValueOnce(jsonResponse(401, { message: "no valid refresh cookie" })); // /auth/refresh fails
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.tests.get("1")).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getToken()).toBeNull();
  });

  it("does not attempt a refresh when /auth/refresh itself returns 401", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(401, { message: "no cookie" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.auth.refresh()).rejects.toThrow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent 401s into a single refresh call (single-flight)", async () => {
    setToken("expired-token");
    let refreshCalls = 0;
    const fetchMock: Mock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/refresh")) {
        refreshCalls += 1;
        return Promise.resolve(jsonResponse(200, { accessToken: "fresh-token" }));
      }
      // /entries: succeeds once the fresh token has been applied, 401 otherwise
      const isRetryWithFreshToken = getToken() === "fresh-token";
      return Promise.resolve(isRetryWithFreshToken ? jsonResponse(200, []) : jsonResponse(401, {}));
    });
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([api.entries.list(), api.entries.list()]);

    expect(refreshCalls).toBe(1);
  });
});
