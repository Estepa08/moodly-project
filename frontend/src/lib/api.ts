import type { components } from "./api-types";

type AuthResponse = components["schemas"]["AuthResponse"];
type Entry = components["schemas"]["Entry"];
type EntryCreate = components["schemas"]["EntryCreate"];
type Parameter = components["schemas"]["Parameter"];
type Test = components["schemas"]["Test"];
type TestResult = components["schemas"]["TestResult"];
type Feedback = components["schemas"]["Feedback"];
type FeedbackCreate = components["schemas"]["FeedbackCreate"];
type OnboardingStory = components["schemas"]["OnboardingStory"];
type Report = components["schemas"]["Report"];
type ReportCreate = components["schemas"]["ReportCreate"];
type User = components["schemas"]["User"];
type UserUpdate = components["schemas"]["UserUpdate"];

interface CreatureState {
  id: string;
  userId: string;
  calmness: number;
  lastExerciseAt?: string;
}

const BASE_URL = "/api";

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

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

function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem("refreshToken", token);
  } else {
    localStorage.removeItem("refreshToken");
  }
}

async function attemptRefresh(): Promise<boolean> {
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) return false;
  try {
    const data = await api.auth.refresh(storedRefreshToken);
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    setToken(null);
    setRefreshToken(null);
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 → attempt token refresh once
  if (res.status === 401 && getRefreshToken()) {
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getToken()}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

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
      request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
    demo: () => request<AuthResponse>("/auth/demo", { method: "POST" }),
    refresh: (refreshToken: string) =>
      request<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
    forgotPassword: (body: { email: string }) =>
      request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    resetPassword: (body: { token: string; password: string }) =>
      request<AuthResponse & { message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  },
  users: {
    me: () => request<User>("/users/me"),
    update: (body: UserUpdate) =>
      request<User>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
    delete: () => request<void>("/users/me", { method: "DELETE" }),
  },
  parameters: {
    list: () => request<Parameter[]>("/parameters"),
  },
  entries: {
    list: (params?: { parameterId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams();
      if (params?.parameterId) q.set("parameterId", params.parameterId);
      if (params?.from) q.set("from", params.from);
      if (params?.to) q.set("to", params.to);
      const qs = q.toString();
      return request<Entry[]>(`/entries${qs ? `?${qs}` : ""}`);
    },
    create: (body: EntryCreate) =>
      request<Entry>("/entries", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request<Entry>(`/entries/${id}`),
    update: (id: string, body: { value?: number; note?: string }) =>
      request<Entry>(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/entries/${id}`, { method: "DELETE" }),
  },
  tests: {
    list: () => request<Pick<Test, "id" | "title" | "description">[]>("/tests"),
    get: (id: string) => request<Test>(`/tests/${id}`),
    submitResult: (id: string, body: { answers: { questionId: string; optionId: string }[] }) =>
      request<TestResult>(`/tests/${id}/results`, { method: "POST", body: JSON.stringify(body) }),
  },
  testResults: {
    list: (testId?: string) => {
      const q = testId ? `?testId=${testId}` : "";
      return request<TestResult[]>(`/test-results${q}`);
    },
    get: (id: string) => request<TestResult>(`/test-results/${id}`),
  },
  feedback: {
    create: (body: FeedbackCreate) =>
      request<Feedback>("/feedback", { method: "POST", body: JSON.stringify(body) }),
    listMine: () => request<Feedback[]>("/feedback/me"),
  },
  onboarding: {
    list: () => request<OnboardingStory[]>("/onboarding-stories"),
  },
  reports: {
    create: (body: ReportCreate) =>
      request<Report>("/reports", { method: "POST", body: JSON.stringify(body) }),
    list: () => request<Report[]>("/reports"),
    get: (id: string) => request<Report>(`/reports/${id}`),
    download: (id: string) => `${BASE_URL}/reports/${id}/download`,
    delete: (id: string) => request<void>(`/reports/${id}`, { method: "DELETE" }),
  },
  creature: {
    getState: () => request<CreatureState>("/creature"),
    completeExercise: (duration: number) =>
      request<CreatureState>("/creature/exercise/complete", {
        method: "POST",
        body: JSON.stringify({ duration }),
      }),
  },
};
