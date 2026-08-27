import { ApiError } from './api-error';
import type { components } from './api-types';

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
  /** Реферальный код с лендинга (Сессия 8) — необязателен, только для лога. */
  referralCode?: string;
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
type RefreshResponse = components['schemas']['RefreshResponse'];
type ResetPasswordResponse = components['schemas']['ResetPasswordResponse'];
type Entry = components['schemas']['Entry'];
type Parameter = components['schemas']['Parameter'];
type Test = components['schemas']['Test'];
type TestResult = components['schemas']['TestResult'];
type Feedback = components['schemas']['Feedback'];
export type FeedbackCreate = components['schemas']['FeedbackCreate'];
type OnboardingStory = components['schemas']['OnboardingStory'];
type User = components['schemas']['User'];
type UserUpdate = components['schemas']['UserUpdate'];
export type AdminUser = components['schemas']['AdminUser'] & {
  subscriptionTier: string;
  subscriptionExpiresAt?: string | null;
};
export type AdminFeedback = components['schemas']['AdminFeedback'];
type CbaExample = components['schemas']['CbaExample'];
type CbaCommonItem = components['schemas']['CbaCommonItem'];
type CbaEntry = components['schemas']['CbaEntry'];
type CbaEntryCreate = components['schemas']['CbaEntryCreate'];
type ResponsibilityPieEntry = components['schemas']['ResponsibilityPieEntry'];
type ResponsibilityPieEntryCreate = components['schemas']['ResponsibilityPieEntryCreate'];
type DecatastrophizingEntry = components['schemas']['DecatastrophizingEntry'];
type DecatastrophizingEntryCreate = components['schemas']['DecatastrophizingEntryCreate'];
type EmotionLabState = components['schemas']['EmotionLabState'];
type EmotionLabAttemptRequest = components['schemas']['EmotionLabAttemptRequest'];
type EmotionLabAttemptResponse = components['schemas']['EmotionLabAttemptResponse'];

export type ReminderMode = 'exact' | 'window';

export interface UserPreference {
  goals: string[];
  experienceLevel: string;
  dailyReminder: boolean;
  reminderTime?: string;
  reminderMode?: ReminderMode;
  reminderWindowStart?: string;
  reminderWindowEnd?: string;
  afternoonReminder: boolean;
  afternoonTime?: string;
  afternoonMode?: ReminderMode;
  afternoonWindowStart?: string;
  afternoonWindowEnd?: string;
  eveningReminder: boolean;
  eveningTime?: string;
  eveningMode?: ReminderMode;
  eveningWindowStart?: string;
  eveningWindowEnd?: string;
  onboardingDone: boolean;
  showSupportResources: boolean;
}

export type MotivationMessage = components['schemas']['MotivationMessage'];
export type MotivationMessageCreate = components['schemas']['MotivationMessageCreate'];
export type MotivationMessageUpdate = components['schemas']['MotivationMessageUpdate'];
export type MessageOfDay = components['schemas']['MessageOfDay'];

export interface SyncAction {
  entity:
    | 'entry'
    | 'feedback'
    | 'testResult'
    | 'breathingSession'
    | 'practiceCompletion'
    | 'creatureState';
  action: 'upsert' | 'delete';
  id: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface SyncChange {
  entity: SyncAction['entity'] | 'userAchievement';
  id: string;
  action: 'upsert' | 'delete';
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
  petMood?: 'happy' | 'calm' | 'support';
  stage?: 'baby' | 'kid' | 'adult' | 'max';
  feedCount?: number;
  feedCounts?: Record<string, number>;
  petCount?: number;
  petCountRemaining?: number;
  lastPetAt?: string | null;
  comfort?: number;
  weeklyClaimWeek?: string | null;
  streakFreezeCount: number;
  adventureReturnAt?: string | null;
}

export interface PetBonus {
  /** Бонус «Бодрое утро» (6:00–12:00): 3-й клик дал +2 XP */
  morning: boolean;
  /** Бонус «Спокойный вечер» (20:00–23:00): 3-й клик дал +1 XP и +1 calmness */
  evening: boolean;
  /** Бонус «Возвращение» (пауза > 4 ч): клик дал +2 XP */
  welcome: boolean;
  /** Бонус «Эмпатия»: 3-й клик дал +1 XP и +2 comfort */
  empathy: boolean;
  /** Текущая длина серии быстрых кликов (< 0.5 c) */
  comboCount: number;
  /** На этом клике сработал бонус «Комбо» (+3 XP) */
  comboBonusAwarded: boolean;
  /** На сколько вырос calmness этим кликом */
  calmnessGain: number;
  /** На сколько вырос comfort этим кликом */
  comfortGain: number;
}

interface CheckInResponse {
  state: CreatureState;
  leveledUp: boolean;
  /** Пропуск дня был покрыт токеном заморозки стрика вместо сброса серии */
  streakFreezeUsed: boolean;
  /** Сработавший comeback-тир в днях (7 / 14 / 30), если чек-ин пришёл после долгого перерыва */
  comebackDays?: 7 | 14 | 30;
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
  /** Позиция текущего клика в цикле поглаживаний 1-2-3 (3 → начислен XP) */
  cyclePosition?: number;
  /** На сколько вырос calmness этим кликом (бонус «Спокойный вечер») */
  calmnessGain?: number;
  /** На сколько вырос comfort этим кликом (бонус «Эмпатия») */
  comfortGain?: number;
  /** Текущая длина серии быстрых кликов */
  comboCount?: number;
  /** На этом клике сработал бонус «Комбо» (+3 XP) */
  comboBonusAwarded?: boolean;
  /** Скрытые бонусы, сработавшие на этом клике */
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

export interface WeeklyDay {
  date: string;
  /** 0=Пн … 6=Вс */
  dayOfWeek: number;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeeklyState {
  weekStart: string;
  days: WeeklyDay[];
  completedCount: number;
  goal: number;
  goalReached: boolean;
  claimed: boolean;
  xpReward: number;
}

export interface ClaimWeeklyResponse {
  claimed: boolean;
  xpAwarded: number;
  leveledUp: boolean;
}

export interface ClaimAdventureResponse {
  state: CreatureState;
  leveledUp: boolean;
  xpAwarded: number;
  comfortGain: number;
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
  streakFreezeReward: number | null;
  sortOrder: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

const BASE_URL = '/api';

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let refreshSingleFlight: Promise<RefreshResponse> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setToken(token: string | null) {
  accessToken = token;
}

export function getToken(): string | null {
  return accessToken;
}

// AuthProvider registers a callback here so a refresh that fails mid-session
// (e.g. the refresh cookie was revoked by a password reset elsewhere) can
// flip isAuthenticated to false and send the user back to /login, instead of
// leaving the app silently 401-ing on every request forever.
export function setOnSessionExpired(cb: (() => void) | null) {
  onSessionExpired = cb;
}

// The refresh token itself lives in an httpOnly cookie set by the API and is
// never readable from JS — the browser attaches it automatically on requests
// made with credentials: "include". We can't check for its presence before
// trying, so a 401 always gets one refresh attempt; the endpoint just
// answers 401 itself if there's no valid cookie.
async function attemptRefresh(): Promise<boolean> {
  try {
    const data = await api.auth.refresh();
    setToken(data.accessToken);
    return true;
  } catch {
    setToken(null);
    onSessionExpired?.();
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });

  // 401 → attempt token refresh once
  if (res.status === 401 && path !== '/auth/refresh') {
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
    }
  }

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(error.code || 'UNKNOWN', error.message || 'Request failed', res.status);
  }
  return res.json();
}

export const api = {
  auth: {
    register: (body: RegisterBody) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    refresh: () => {
      // Coalesce concurrent refresh calls (e.g. StrictMode double-invoke) so a
      // single rotation of the one-time refresh token answers all callers
      // instead of a second call racing it to a 401.
      if (!refreshSingleFlight) {
        refreshSingleFlight = request<RefreshResponse>('/auth/refresh', { method: 'POST' }).finally(
          () => {
            refreshSingleFlight = null;
          },
        );
      }
      return refreshSingleFlight;
    },
    forgotPassword: (body: { email: string }) =>
      request<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    resetPassword: (body: ResetPasswordBody) =>
      request<ResetPasswordResponse>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    recoveryInfo: (body: { token: string }) =>
      request<{ recoveryWrappedKey: string | null; recoverySalt: string | null }>(
        '/auth/reset-info',
        { method: 'POST', body: JSON.stringify(body) },
      ),
    setKeys: (body: SetKeysBody) =>
      request<{ ok: boolean }>('/auth/set-keys', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  users: {
    me: () => request<User>('/users/me'),
    update: (body: UserUpdate) =>
      request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
    delete: () => request<void>('/users/me', { method: 'DELETE' }),
    getPreferences: () => request<UserPreference | null>('/users/me/preferences'),
    savePreferences: (body: Partial<UserPreference>) =>
      request<UserPreference>('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
  },
  parameters: {
    list: () => request<Parameter[]>('/parameters'),
  },
  entries: {
    list: (params?: { parameterId?: string; from?: string; to?: string }) => {
      const q = new URLSearchParams();
      if (params?.parameterId) q.set('parameterId', params.parameterId);
      if (params?.from) q.set('from', params.from);
      if (params?.to) q.set('to', params.to);
      const qs = q.toString();
      return request<Entry[]>(`/entries${qs ? `?${qs}` : ''}`);
    },
    create: (body: { id: string; parameterId: string; encryptedData: string }) =>
      request<Entry>('/entries', { method: 'POST', body: JSON.stringify(body) }),
    get: (id: string) => request<Entry>(`/entries/${id}`),
    update: (id: string, body: { encryptedData: string }) =>
      request<Entry>(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/entries/${id}`, { method: 'DELETE' }),
  },
  tests: {
    list: () => request<Pick<Test, 'id' | 'title' | 'description'>[]>('/tests'),
    get: (id: string) => request<Test>(`/tests/${id}`),
  },
  testResults: {
    list: (testId?: string) => {
      const q = testId ? `?testId=${testId}` : '';
      return request<TestResult[]>(`/test-results${q}`);
    },
    get: (id: string) => request<TestResult>(`/test-results/${id}`),
  },
  feedback: {
    create: (body: FeedbackCreate) =>
      request<Feedback>('/feedback', { method: 'POST', body: JSON.stringify(body) }),
    listMine: () => request<Feedback[]>('/feedback/me'),
  },
  onboarding: {
    list: () => request<OnboardingStory[]>('/onboarding-stories'),
  },
  creature: {
    getState: () => request<CreatureState>('/creature'),
    checkIn: () => request<CheckInResponse>('/creature/check-in', { method: 'POST' }),
    completeExercise: (duration: number) =>
      request<CheckInResponse>('/creature/exercise/complete', {
        method: 'POST',
        body: JSON.stringify({ duration }),
      }),
    reward: (source: string) =>
      request<CheckInResponse>('/creature/reward', {
        method: 'POST',
        body: JSON.stringify({ source }),
      }),
    feed: () => request<FeedResponse>('/creature/feed', { method: 'POST' }),
    pet: (empathy?: boolean) =>
      request<PetResponse>('/creature/pet', {
        method: 'POST',
        body: empathy ? JSON.stringify({ empathy: true }) : undefined,
      }),
    getCompletions: (days = 30) =>
      request<PracticeCompletion[]>(`/creature/completions?days=${days}`),
    getStats: () => request<CreatureStats>('/creature/stats'),
    getPets: () => request<PetCollection>('/creature/pets'),
    setPet: (petType?: string, petName?: string | null) =>
      request<PetCollection>('/creature/pet', {
        method: 'PATCH',
        body: JSON.stringify({ petType, petName }),
      }),
    getHeatmap: (days = 90) => request<HeatmapEntry[]>(`/creature/heatmap?days=${days}`),
    getMissions: () => request<Mission[]>('/creature/missions'),
    claimMission: (id: string) =>
      request<ClaimMissionResponse>(`/creature/missions/${id}/claim`, { method: 'POST' }),
    setTitle: (title: string | null) =>
      request<{ activeTitle: string | null }>('/creature/title', {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    getWeekly: () => request<WeeklyState>('/creature/weekly'),
    claimWeekly: () => request<ClaimWeeklyResponse>('/creature/weekly/claim', { method: 'POST' }),
    claimAdventure: () =>
      request<ClaimAdventureResponse>('/creature/adventure/claim', { method: 'POST' }),
  },
  achievements: {
    list: () => request<Achievement[]>('/achievements'),
    check: () => request<Achievement[]>('/achievements/check', { method: 'POST' }),
  },
  push: {
    subscribe: (body: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
      request<{ ok: boolean }>('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    unsubscribe: (body: { endpoint: string }) =>
      request<{ ok: boolean }>('/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    send: (body: { title: string; body?: string; url?: string }) =>
      request<{ ok: boolean; sent: number }>('/push/send', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  cba: {
    examples: () => request<CbaExample[]>('/cba/examples'),
    commonItems: () => request<CbaCommonItem[]>('/cba/common-items'),
    entries: {
      list: () => request<CbaEntry[]>('/cba/entries'),
      create: (body: CbaEntryCreate) =>
        request<CbaEntry>('/cba/entries', { method: 'POST', body: JSON.stringify(body) }),
      delete: (id: string) => request<void>(`/cba/entries/${id}`, { method: 'DELETE' }),
    },
  },
  responsibilityPie: {
    entries: {
      list: () => request<ResponsibilityPieEntry[]>('/responsibility-pie/entries'),
      create: (body: ResponsibilityPieEntryCreate) =>
        request<ResponsibilityPieEntry>('/responsibility-pie/entries', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      delete: (id: string) =>
        request<void>(`/responsibility-pie/entries/${id}`, { method: 'DELETE' }),
    },
  },
  decatastrophizing: {
    entries: {
      list: () => request<DecatastrophizingEntry[]>('/decatastrophizing/entries'),
      create: (body: DecatastrophizingEntryCreate) =>
        request<DecatastrophizingEntry>('/decatastrophizing/entries', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      delete: (id: string) =>
        request<void>(`/decatastrophizing/entries/${id}`, { method: 'DELETE' }),
    },
  },
  emotionLab: {
    state: () => request<EmotionLabState>('/emotion-lab/state'),
    attempt: (body: EmotionLabAttemptRequest) =>
      request<EmotionLabAttemptResponse>('/emotion-lab/attempt', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  admin: {
    listUsers: () => request<AdminUser[]>('/admin/users'),
    deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
    listFeedback: () => request<AdminFeedback[]>('/admin/feedback'),
    updateTier: (id: string, tier: 'free' | 'premium') =>
      request<{ id: string; email: string; subscriptionTier: string }>(`/admin/users/${id}/tier`, {
        method: 'PATCH',
        body: JSON.stringify({ tier }),
      }),
  },
  content: {
    messageOfDay: (type: string, locale: string) =>
      request<MessageOfDay | null>(
        `/content/message-of-day?type=${encodeURIComponent(type)}&locale=${encodeURIComponent(locale)}`,
      ),
    listMessages: (params?: { type?: string; locale?: string; active?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.locale) q.set('locale', params.locale);
      if (params?.active) q.set('active', params.active);
      const qs = q.toString();
      return request<MotivationMessage[]>(`/content/messages${qs ? `?${qs}` : ''}`);
    },
    createMessage: (body: MotivationMessageCreate) =>
      request<MotivationMessage>('/content/messages', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateMessage: (id: string, body: MotivationMessageUpdate) =>
      request<MotivationMessage>(`/content/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteMessage: (id: string) => request<void>(`/content/messages/${id}`, { method: 'DELETE' }),
  },
  sync: {
    push: (actions: SyncAction[]) =>
      request<{ applied: number }>('/sync/push', {
        method: 'POST',
        body: JSON.stringify({ actions }),
      }),
    pull: (opts?: { since?: string; sinceId?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (opts?.since) q.set('since', opts.since);
      if (opts?.sinceId) q.set('sinceId', opts.sinceId);
      if (opts?.limit) q.set('limit', String(opts.limit));
      const qs = q.toString();
      return request<PullResult>(`/sync/pull${qs ? `?${qs}` : ''}`);
    },
  },
};
