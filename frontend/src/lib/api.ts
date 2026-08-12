import { ApiError } from "./api-error";
import type { components } from "./api-types";

export interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  ageConfirmed: boolean;
  pdpConsent: boolean;
  birthYear?: number;
  wrappedKey: string;
  keySalt: string;
  recoveryWrappedKey: string;
  recoverySalt: string;
}

export interface ResetPasswordBody {
  token: string;
  password: string;
  wrappedKey: string;
  keySalt: string;
}

export interface SetKeysBody {
  wrappedKey: string;
  keySalt: string;
  recoveryWrappedKey: string;
  recoverySalt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  wrappedKey?: string | null;
  keySalt?: string | null;
}
type RefreshResponse = components["schemas"]["RefreshResponse"];
type Entry = components["schemas"]["Entry"];
type Parameter = components["schemas"]["Parameter"];
type Test = components["schemas"]["Test"];
type TestResult = components["schemas"]["TestResult"];
type Feedback = components["schemas"]["Feedback"];
export type FeedbackCreate = components["schemas"]["FeedbackCreate"];
type OnboardingStory = components["schemas"]["OnboardingStory"];
type User = components["schemas"]["User"];
type UserUpdate = components["schemas"]["UserUpdate"];
export type AdminUser = components["schemas"]["AdminUser"];
export type AdminFeedback = components["schemas"]["AdminFeedback"];
type CbaExample = components["schemas"]["CbaExample"];
type CbaCommonItem = components["schemas"]["CbaCommonItem"];
type CbaEntry = components["schemas"]["CbaEntry"];
type CbaEntryCreate = components["schemas"]["CbaEntryCreate"];
type EmotionLabState = components["schemas"]["EmotionLabState"];
type EmotionLabAttemptRequest = components["schemas"]["EmotionLabAttemptRequest"];
type EmotionLabAttemptResponse = components["schemas"]["EmotionLabAttemptResponse"];

export interface UserPreference {
  goals: string[];
  experienceLevel: string;
  dailyReminder: boolean;
  reminderTime?: string;
  afternoonReminder: boolean;
  afternoonTime?: string;
  eveningReminder: boolean;
  eveningTime?: string;
  onboardingDone: boolean;
  showSupportResources: boolean;
}

export type MotivationMessage = components["schemas"]["MotivationMessage"];
export type MotivationMessageCreate = components["schemas"]["MotivationMessageCreate"];
export type MotivationMessageUpdate = components["schemas"]["MotivationMessageUpdate"];
export type MessageOfDay = components["schemas"]["MessageOfDay"];

export interface SyncAction {
  entity:
    | "entry"
    | "feedback"
    | "testResult"
    | "breathingSession"
    | "practiceCompletion"
    | "creatureState";
  action: "upsert" | "delete";
  id: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface SyncChange {
  entity: SyncAction["entity"] | "userAchievement";
  id: string;
  action: "upsert" | "delete";
  updatedAt: string;
  data: Record<string, unknown>;
}

export interface PullResult {
  cursor: string;
  cursorId: string;
  hasMore: boolean;
  changes: SyncChange[];
}

export interface CreatureState {
  id: string;
  userId: string;
  calmness: number;
  energy: number;
  level: number;
  experience: number;
  streak: number;
  lastCheckInAt?: string;
  lastExerciseAt?: string;
  sessionCount: number;
  petType?: string;
  unlockedPetTypes?: string[];
  petName?: string | null;
  activeTitle?: string | null;
  unlockedTitles?: string[];
  activeSkin?: string;
  unlockedSkins?: string[];
  petMood?: "happy" | "calm" | "support";
  stage?: "baby" | "kid" | "adult" | "max";
  feedCount?: number;
  feedCounts?: Record<string, number>;
  petCount?: number;
  petCountRemaining?: number;
  lastPetAt?: string | null;
  comfort?: number;
}

export interface PetBonus {
  morning: boolean;
  evening: boolean;
  welcome: boolean;
  empathy: boolean;
  comboCount: number;
  comboBonusAwarded: boolean;
  calmnessGain: number;
  comfortGain: number;
}

interface CheckInResponse {
  state: CreatureState;
  leveledUp: boolean;
}

export interface FeedResponse {
  state: CreatureState;
  leveledUp: boolean;
  xpAwarded: number;
  feedCount: number;
  feedCounts: Record<string, number>;
}

export interface PetResponse {
  state: CreatureState;
  leveledUp: boolean;
  xpAwarded: number;
  petCount: number;
  petCountRemaining: number;
  limitReached: boolean;
  cyclePosition?: number;
  calmnessGain?: number;
  comfortGain?: number;
  comboCount?: number;
  comboBonusAwarded?: boolean;
  bonus?: PetBonus;
}

interface PracticeCompletion {
  source: string;
  xpAwarded: number;
  createdAt: string;
}

export interface CreatureStats {
  totalXp: number;
  totalEarnedXp: number;
  totalPractices: number;
  totalCheckins: number;
  daysSinceFirst: number;
  level: number;
  streak: number;
  calmness: number;
  energy: number;
  sourceBreakdown: Record<string, number>;
  feedCount?: number;
  feedCounts?: Record<string, number>;
}

export interface PetCollection {
  unlockedPetTypes: string[];
  activePetType: string;
  petName: string | null;
  feedCounts?: Record<string, number>;
}

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface Mission {
  id: string;
  missionKey: string;
  labelKey: string;
  xpReward: number;
  progress: number;
  claimed: boolean;
  sortOrder: number;
}

export interface ClaimMissionResponse {
  claimed: boolean;
  xpAwarded: number;
  leveledUp: boolean;
}

export interface Achievement {
  id: string;
  key: string;
  category: string;
  titleKey: string;
  descKey: string;
  iconName: string;
  skinReward: string | null;
  titleReward: string | null;
  petTypeReward: string | null;
  xpReward: number;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

const BASE_URL = "/api";

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let refreshSingleFlight: Promise<RefreshResponse> | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

export function getToken(): string | null {
  return accessToken;
}

async function attemptRefresh(): Promise<boolean> {
  try {
    const data = await api.auth.refresh();
    setToken(data.accessToken);
    return true;
  } catch {
    setToken(null);
    return false;
  }
}

// Добавляем логирование в request
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Логируем запрос
  console.log(`📤 ${options.method || "GET"} ${path}`);
  if (options.body) {
    console.log("📦 Request body:", options.body);
  }
  console.log("🔑 Token:", token ? "present" : "missing");

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Логируем ответ
  console.log(`📥 Response status: ${res.status} ${res.statusText}`);

  // 401 → attempt token refresh once
  if (res.status === 401 && path !== "/auth/refresh") {
    console.log("🔄 Attempting token refresh...");
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      console.log("✅ Token refreshed, retrying request");
      headers["Authorization"] = `Bearer ${getToken()}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: "include" });
      console.log(`📥 Retry response status: ${res.status}`);
    } else {
      console.log("❌ Token refresh failed");
    }
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: res.statusText };
    }
    console.error(`❌ API Error ${res.status}:`, errorData);
    throw new ApiError(
      errorData.code || "UNKNOWN",
      errorData.message || "Request failed",
      res.status,
    );
  }

  const data = await res.json();
  console.log(`✅ Response data:`, data);
  return data;
}

export const api = {
  auth: {
    register: (body: RegisterBody) =>
      request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<void>("/auth/logout", { method: "POST" }),
    refresh: () => {
      if (!refreshSingleFlight) {
        refreshSingleFlight = request<RefreshResponse>("/auth/refresh", { method: "POST" }).finally(
          () => {
            refreshSingleFlight = null;
          },
        );
      }
      return refreshSingleFlight;
    },
    forgotPassword: (body: { email: string }) =>
      request<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    resetPassword: (body: ResetPasswordBody) =>
      request<AuthResponse>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    recoveryInfo: (body: { token: string }) =>
      request<{ recoveryWrappedKey: string | null; recoverySalt: string | null }>(
        "/auth/reset-info",
        { method: "POST", body: JSON.stringify(body) },
      ),
    setKeys: (body: SetKeysBody) =>
      request<{ ok: boolean }>("/auth/set-keys", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  users: {
    me: () => request<User>("/users/me"),
    update: (body: UserUpdate) =>
      request<User>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),
    delete: () => request<void>("/users/me", { method: "DELETE" }),
    getPreferences: () => request<UserPreference | null>("/users/me/preferences"),
    savePreferences: (body: Partial<UserPreference>) =>
      request<UserPreference>("/users/me/preferences", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
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
    create: (body: { id: string; parameterId: string; encryptedData: string }) =>
      request<Entry>("/entries", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request<Entry>(`/entries/${id}`),
    update: (id: string, body: { encryptedData: string }) =>
      request<Entry>(`/entries/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/entries/${id}`, { method: "DELETE" }),
  },
  tests: {
    list: () => request<Pick<Test, "id" | "title" | "description">[]>("/tests"),
    get: (id: string) => request<Test>(`/tests/${id}`),
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
  creature: {
    getState: () => request<CreatureState>("/creature"),
    checkIn: () => request<CheckInResponse>("/creature/check-in", { method: "POST" }),
    completeExercise: (duration: number) =>
      request<CheckInResponse>("/creature/exercise/complete", {
        method: "POST",
        body: JSON.stringify({ duration }),
      }),
    reward: (source: string) =>
      request<CheckInResponse>("/creature/reward", {
        method: "POST",
        body: JSON.stringify({ source }),
      }),
    feed: () => request<FeedResponse>("/creature/feed", { method: "POST" }),
    pet: (empathy?: boolean) =>
      request<PetResponse>("/creature/pet", {
        method: "POST",
        body: empathy ? JSON.stringify({ empathy: true }) : undefined,
      }),
    getCompletions: (days = 30) =>
      request<PracticeCompletion[]>(`/creature/completions?days=${days}`),
    getStats: () => request<CreatureStats>("/creature/stats"),
    getPets: () => request<PetCollection>("/creature/pets"),
    setPet: (petType?: string, petName?: string | null) =>
      request<PetCollection>("/creature/pet", {
        method: "PATCH",
        body: JSON.stringify({ petType, petName }),
      }),
    getHeatmap: (days = 90) => request<HeatmapEntry[]>(`/creature/heatmap?days=${days}`),
    getMissions: () => request<Mission[]>("/creature/missions"),
    claimMission: (id: string) =>
      request<ClaimMissionResponse>(`/creature/missions/${id}/claim`, { method: "POST" }),
    setTitle: (title: string | null) =>
      request<{ activeTitle: string | null }>("/creature/title", {
        method: "PATCH",
        body: JSON.stringify({ title }),
      }),
  },
  achievements: {
    list: () => request<Achievement[]>("/achievements"),
    check: () => request<Achievement[]>("/achievements/check", { method: "POST" }),
  },
  push: {
    subscribe: (body: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
      request<{ ok: boolean }>("/push/subscribe", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    unsubscribe: (body: { endpoint: string }) =>
      request<{ ok: boolean }>("/push/unsubscribe", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    send: (body: { title: string; body?: string; url?: string }) =>
      request<{ ok: boolean; sent: number }>("/push/send", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  cba: {
    examples: () => request<CbaExample[]>("/cba/examples"),
    commonItems: () => request<CbaCommonItem[]>("/cba/common-items"),
    entries: {
      list: () => request<CbaEntry[]>("/cba/entries"),
      create: (body: CbaEntryCreate) =>
        request<CbaEntry>("/cba/entries", { method: "POST", body: JSON.stringify(body) }),
      delete: (id: string) => request<void>(`/cba/entries/${id}`, { method: "DELETE" }),
    },
  },
  admin: {
    listUsers: () => request<AdminUser[]>("/admin/users"),
    deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: "DELETE" }),
    listFeedback: () => request<AdminFeedback[]>("/admin/feedback"),
  },
  content: {
    messageOfDay: (type: string, locale: string) =>
      request<MessageOfDay | null>(
        `/content/message-of-day?type=${encodeURIComponent(type)}&locale=${encodeURIComponent(locale)}`,
      ),
    listMessages: (params?: { type?: string; locale?: string; active?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set("type", params.type);
      if (params?.locale) q.set("locale", params.locale);
      if (params?.active) q.set("active", params.active);
      const qs = q.toString();
      return request<MotivationMessage[]>(`/content/messages${qs ? `?${qs}` : ""}`);
    },
    createMessage: (body: MotivationMessageCreate) =>
      request<MotivationMessage>("/content/messages", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateMessage: (id: string, body: MotivationMessageUpdate) =>
      request<MotivationMessage>(`/content/messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteMessage: (id: string) => request<void>(`/content/messages/${id}`, { method: "DELETE" }),
  },
  sync: {
    push: (actions: SyncAction[]) =>
      request<{ applied: number }>("/sync/push", {
        method: "POST",
        body: JSON.stringify({ actions }),
      }),
    pull: (opts?: { since?: string; sinceId?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (opts?.since) q.set("since", opts.since);
      if (opts?.sinceId) q.set("sinceId", opts.sinceId);
      if (opts?.limit) q.set("limit", String(opts.limit));
      const qs = q.toString();
      return request<PullResult>(`/sync/pull${qs ? `?${qs}` : ""}`);
    },
  },
  emotionLab: {
    state: () => {
      console.log("🔬 Calling emotionLab.state()");
      return request<EmotionLabState>("/emotion-lab/state");
    },
    attempt: (body: EmotionLabAttemptRequest) => {
      console.log("🔬 Calling emotionLab.attempt() with:", body);
      return request<EmotionLabAttemptResponse>("/emotion-lab/attempt", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  },
};
