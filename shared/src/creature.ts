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

// Поглаживания компаньона: +1 XP за каждый 3-й клик (детерминированный
// цикл 1-2-3), не более 100 XP в сутки. На кликах 1-2 показываются только
// эмодзи-пузыри, на клике 3 — +1 XP и −1 энергии.
export const PET_XP = 1;
export const PET_XP_DAILY_LIMIT = 100;
export const PET_CYCLE = 3;
export const PET_ENERGY_COST = 1;
// Дневной лимит самих кликов = XP-лимит × цикл (300 кликов дают 100 XP).
export const PET_DAILY_CLICK_LIMIT = PET_XP_DAILY_LIMIT * PET_CYCLE;

// Порог энергии (в единицах, от 0 до MAX_ENERGY=100), при котором компаньон
// считается уставшим: ниже порога показываем уведомление/подсказку.
export const ENERGY_LOW_THRESHOLD = 20;

// ===== Скрытые бонусы поглаживаний (время — по серверному/локальному часу) =====

// «Бодрое утро»: с 6:00 до 12:00 каждый 3-й клик даёт +2 XP вместо +1.
export const MORNING_BONUS_START_HOUR = 6;
export const MORNING_BONUS_END_HOUR = 12;
export const MORNING_XP = 2;

// «Спокойный вечер»: с 20:00 до 23:00 каждый 3-й клик даёт +1 XP и +1 calmness.
export const EVENING_BONUS_START_HOUR = 20;
export const EVENING_BONUS_END_HOUR = 23;
export const EVENING_CALMNESS_GAIN = 1;

// «Комбо»: серия кликов с интервалом < COMBO_WINDOW_MS; на каждом
// COMBO_THRESHOLD-м быстром клике начисляется COMBO_XP сверх обычного.
export const COMBO_THRESHOLD = 5;
export const COMBO_WINDOW_MS = 500;
export const COMBO_XP = 3;
// Сколько последних времен кликов храним в CreatureState.petTimes.
export const PET_TIMES_BUFFER = 10;

// «Возвращение»: после паузы > WELCOME_PAUSE_HOURS первые
// WELCOME_CLICK_COUNT кликов дают по WELCOME_XP каждый.
export const WELCOME_PAUSE_HOURS = 4;
export const WELCOME_CLICK_COUNT = 3;
export const WELCOME_XP = 2;

// «Эмпатия»: клик даёт +EMPATHY_COMFORT_GAIN к параметру «Утешение» (comfort).
export const EMPATHY_COMFORT_GAIN = 2;
// Граница «грустного» настроения: значение записи Mood ≤ порога считается грустью/тревогой.
export const EMPATHY_MOOD_THRESHOLD = 3;

export function isMorningWindow(hour: number): boolean {
  return hour >= MORNING_BONUS_START_HOUR && hour < MORNING_BONUS_END_HOUR;
}

export function isEveningWindow(hour: number): boolean {
  return hour >= EVENING_BONUS_START_HOUR && hour < EVENING_BONUS_END_HOUR;
}

export function isEmpathyMood(value: number): boolean {
  return value <= EMPATHY_MOOD_THRESHOLD;
}

// Длина текущей серии быстрых кликов: массив `times` — метки кликов по
// возрастанию (последний элемент = текущий клик). Считаем подряд идущие
// пары с интервалом < COMBO_WINDOW_MS.
export function computeComboCount(times: number[]): number {
  if (times.length === 0) return 0;
  let count = 1;
  for (let i = times.length - 1; i >= 1; i--) {
    if (times[i] - times[i - 1] < COMBO_WINDOW_MS) count++;
    else break;
  }
  return count;
}

// Восстановление энергии за завершение практики (зависит от вида).
export const PRACTICE_ENERGY_REWARD: Record<string, number> = {
  breathing: 25,
  cba: 25,
  distortions: 25,
  gratitude: 15,
  thoughtJournal: 15,
  sleepHygiene: 15,
  emotionLab: 15,
};

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
  emotionLab: 5,
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
