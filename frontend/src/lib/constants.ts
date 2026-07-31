import { Moon, Sun, Zap, Heart, Activity, type LucideIcon } from "lucide-react";

export enum ParameterName {
  Anxiety = "Anxiety",
  Sleep = "Sleep",
  Mood = "Mood",
  Energy = "Energy",
  Gratitude = "Gratitude",
  SleepHygiene = "Sleep Hygiene",
  DistortionQuiz = "Distortion Quiz",
  ThoughtRelease = "Thought Release",
  Wellbeing = "Wellbeing",
}

export const PARAM_NAME_KEYS: Record<ParameterName, string> = {
  [ParameterName.Anxiety]: "dashboard.anxiety",
  [ParameterName.Sleep]: "dashboard.sleep",
  [ParameterName.Mood]: "dashboard.mood",
  [ParameterName.Energy]: "dashboard.energy",
  [ParameterName.Gratitude]: "dashboard.gratitude",
  [ParameterName.SleepHygiene]: "dashboard.sleepHygiene",
  [ParameterName.DistortionQuiz]: "dashboard.distortionQuiz",
  [ParameterName.ThoughtRelease]: "distortions.tabLetGo",
  [ParameterName.Wellbeing]: "dashboard.wellbeing",
};

export const TEXT_PARAMS = new Set<ParameterName>([
  ParameterName.Gratitude,
  ParameterName.SleepHygiene,
  ParameterName.DistortionQuiz,
  ParameterName.ThoughtRelease,
]);

export const PARAM_COLORS: Partial<Record<ParameterName, string>> = {
  [ParameterName.Anxiety]: "hsl(var(--primary))",
  [ParameterName.Sleep]: "hsl(var(--param-sleep))",
  [ParameterName.Mood]: "hsl(var(--param-mood))",
  [ParameterName.Energy]: "hsl(var(--param-energy))",
};

export const NEGATIVE_VALENCE_PARAMS = new Set<ParameterName>([ParameterName.Anxiety]);

export const PARAM_ICONS: Partial<Record<ParameterName, LucideIcon>> = {
  [ParameterName.Sleep]: Moon,
  [ParameterName.Mood]: Sun,
  [ParameterName.Energy]: Zap,
  [ParameterName.Anxiety]: Activity,
  [ParameterName.Wellbeing]: Heart,
};

export enum SeverityLevel {
  Minimal = "minimal",
  Mild = "mild",
  Moderate = "moderate",
  Severe = "severe",
}

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  [SeverityLevel.Minimal]: "hsl(var(--accent))",
  [SeverityLevel.Mild]: "hsl(var(--severity-mild))",
  [SeverityLevel.Moderate]: "hsl(var(--severity-moderate))",
  [SeverityLevel.Severe]: "hsl(var(--destructive))",
};

export const SLIDER_MIN = 0;
export const SLIDER_MAX = 10;
export const SLIDER_STEP = 0.2;

export enum SleepHygieneListState {
  Checklist = "checklist",
  Completed = "completed",
}

export enum CheckedColor {
  Primary = "primary",
  Accent = "accent",
}

export enum ExpLevel {
  Beginner = "beginner",
  Intermediate = "intermediate",
  Advanced = "advanced",
}

export const CLICK_THRESHOLD = 5;
export const LOCKOUT_DURATION_MS = 5000;
export const CLICK_WINDOW_MS = 2000;

export const ONBOARDING_DONE_KEY = "moodly_onboarding_done";

export enum Trend {
  Up = "up",
  Down = "down",
  Flat = "flat",
}

export enum ComponentSize {
  Sm = "sm",
  Md = "md",
}

export const EXP_PER_LEVEL = 100;
export const MS_PER_DAY = 86400000;

export enum Period {
  OneWeek = "1w",
  TwoWeeks = "2w",
  OneMonth = "1m",
  ThreeMonths = "3m",
  All = "all",
}
