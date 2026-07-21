const BASE_URL = "/api";

let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

export function getToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem("token");
  }
  return accessToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Request failed");
  }
  return res.json();
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string }) =>
      request<{ accessToken: string; user: unknown }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{ accessToken: string; user: unknown }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
  },
  users: {
    me: () => request<unknown>("/users/me"),
    update: (body: { name?: string }) =>
      request<unknown>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
    delete: () => request<void>("/users/me", { method: "DELETE" }),
  },
  parameters: {
    list: () => request<{ id: string; name: string; description?: string; unit?: string }[]>("/parameters"),
  },
  entries: {
    list: (params?: { parameterId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams();
      if (params?.parameterId) q.set("parameterId", params.parameterId);
      if (params?.from) q.set("from", params.from);
      if (params?.to) q.set("to", params.to);
      const qs = q.toString();
      return request<unknown[]>(`/entries${qs ? `?${qs}` : ""}`);
    },
    create: (body: { parameterId: string; value: number; note?: string }) =>
      request<unknown>("/entries", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request<unknown>(`/entries/${id}`),
    update: (id: string, body: { value?: number; note?: string }) =>
      request<unknown>(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/entries/${id}`, { method: "DELETE" }),
  },
  tests: {
    list: () => request<{ id: string; title: string; description?: string }[]>("/tests"),
    get: (id: string) => request<unknown>(`/tests/${id}`),
    submitResult: (id: string, body: { answers: { questionId: string; optionId: string }[] }) =>
      request<unknown>(`/tests/${id}/results`, { method: "POST", body: JSON.stringify(body) }),
  },
  testResults: {
    list: (testId?: string) => {
      const q = testId ? `?testId=${testId}` : "";
      return request<unknown[]>(`/test-results${q}`);
    },
    get: (id: string) => request<unknown>(`/test-results/${id}`),
  },
  feedback: {
    create: (body: { message: string }) =>
      request<unknown>("/feedback", { method: "POST", body: JSON.stringify(body) }),
    listMine: () => request<unknown[]>("/feedback/me"),
  },
  onboarding: {
    list: () => request<unknown[]>("/onboarding-stories"),
  },
  reports: {
    create: (body: { format: "pdf" | "csv"; periodFrom: string; periodTo: string }) =>
      request<unknown>("/reports", { method: "POST", body: JSON.stringify(body) }),
    list: () => request<unknown[]>("/reports"),
    get: (id: string) => request<unknown>(`/reports/${id}`),
    download: (id: string) => `${BASE_URL}/reports/${id}/download`,
    delete: (id: string) => request<void>(`/reports/${id}`, { method: "DELETE" }),
  },
};
