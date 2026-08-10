// Константы и чистая логика геймификации: лимиты, XP, уровни, миссии.
// Единый источник правды для backend и frontend.

export const EXP_PER_LEVEL = 100;
export const MS_PER_DAY = 86400000;

export const CHECKIN_EXP = 20;
export const EXERCISE_EXP = 10;
export const MAX_ENERGY = 100;
export const MOOD_ENTRY_XP = 5;
export const MOOD_ENTRY_DAILY_LIMIT = 3;
export const MOOD_PARAM_NAME = "Mood";
export const FEED_XP = 1;
export const FEED_XP_DAILY_LIMIT = 50;
export const DAILY_ENTRY_LIMIT = 100;

// Поглаживания компаньона: +1 XP за клик, не более 100 в сутки.
export const PET_XP = 1;
export const PET_XP_DAILY_LIMIT = 100;

export const STARTER_PET_TYPES = ["puff", "sloth", "fox"];

export const EVOLUTION_STAGES = [
  { key: "baby", minLevel: 1 },
  { key: "kid", minLevel: 5 },
  { key: "adult", minLevel: 10 },
  { key: "max", minLevel: 20 },
];

export const PRACTICE_XP: Record<string, number> = {
  breathing: 10,
  gratitude: 5,
  sleepHygiene: 5,
  distortions: 10,
  cba: 10,
  thoughtJournal: 5,
};

export interface MissionDefinition {
  key: string;
  labelKey: string;
  xpReward: number;
}

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  { key: "checkin", labelKey: "missions.checkin", xpReward: 10 },
  { key: "practice_breathing", labelKey: "missions.practiceBreathing", xpReward: 10 },
  { key: "practice_gratitude", labelKey: "missions.practiceGratitude", xpReward: 10 },
  { key: "practice_sleepHygiene", labelKey: "missions.practiceSleepHygiene", xpReward: 10 },
  { key: "practice_distortions", labelKey: "missions.practiceDistortions", xpReward: 10 },
  { key: "practice_cba", labelKey: "missions.practiceCba", xpReward: 10 },
  { key: "practice_thoughtJournal", labelKey: "missions.practiceThoughtJournal", xpReward: 10 },
  { key: "complete_3_practices", labelKey: "missions.complete3Practices", xpReward: 15 },
  { key: "log_mood_entry", labelKey: "missions.logMoodEntry", xpReward: 5 },
  { key: "complete_test", labelKey: "missions.completeTest", xpReward: 15 },
  { key: "log_3_mood_entries", labelKey: "missions.log3MoodEntries", xpReward: 10 },
  { key: "complete_5_practices", labelKey: "missions.complete5Practices", xpReward: 20 },
  { key: "breathing_2", labelKey: "missions.breathing2", xpReward: 10 },
  { key: "streak_2", labelKey: "missions.streak2", xpReward: 10 },
];

export interface LevelState {
  level: number;
  experience: number;
}

export function applyLevelUp(
  state: LevelState,
  xpGain: number,
): LevelState & { leveledUp: boolean } {
  let { level, experience } = state;
  experience += xpGain;
  let leveledUp = false;
  const nextLevelExp = level * EXP_PER_LEVEL;
  if (experience >= nextLevelExp) {
    experience -= nextLevelExp;
    level += 1;
    leveledUp = true;
  }
  return { experience, level, leveledUp };
}

export function stageForLevel(level: number): string {
  let stage = EVOLUTION_STAGES[0].key;
  for (const s of EVOLUTION_STAGES) {
    if (level >= s.minLevel) stage = s.key;
  }
  return stage;
}

// --- детерминированный выбор миссий дня (вместо Math.random) ---

function fnv1a(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export interface SelectedMission {
  missionKey: string;
  labelKey: string;
  xpReward: number;
  sortOrder: number;
}

export function selectDailyMissions(userId: string, date: Date, count = 3): SelectedMission[] {
  const seed = fnv1a(`${userId}:${dateKey(date)}`);
  const rnd = mulberry32(seed);
  const pool = MISSION_DEFINITIONS.map((m) => ({ ...m }));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool
    .slice(0, count)
    .map((m, i) => ({
      missionKey: m.key,
      labelKey: m.labelKey,
      xpReward: m.xpReward,
      sortOrder: i,
    }));
}
