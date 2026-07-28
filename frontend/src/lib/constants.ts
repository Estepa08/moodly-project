import { Moon, Sun, Zap, Heart, Activity, type LucideIcon } from "lucide-react";

export const PARAM_NAME_KEYS: Record<string, string> = {
  Anxiety: "dashboard.anxiety",
  Sleep: "dashboard.sleep",
  Mood: "dashboard.mood",
  Energy: "dashboard.energy",
  Gratitude: "dashboard.gratitude",
  "Sleep Hygiene": "dashboard.sleepHygiene",
  "Distortion Quiz": "dashboard.distortionQuiz",
  "Thought Release": "distortions.tabLetGo",
  Wellbeing: "dashboard.wellbeing",
};

// Non-standard-scale parameters that don't belong in the 0-10 numeric trend chart / averages / quick-entry slider.
export const TEXT_PARAMS = new Set([
  "Gratitude",
  "Sleep Hygiene",
  "Distortion Quiz",
  "Thought Release",
]);

export const PARAM_COLORS: Record<string, string> = {
  Anxiety: "hsl(var(--primary))",
  Sleep: "hsl(var(--param-sleep))",
  Mood: "hsl(270 50% 60%)",
  Energy: "hsl(var(--param-energy))",
};

// Parameters where a *lower* value is better (rising = worse), so their
// color/trend treatment must be inverted relative to Mood/Energy/Sleep.
export const NEGATIVE_VALENCE_PARAMS = new Set(["Anxiety"]);

export const PARAM_ICONS: Record<string, LucideIcon> = {
  Sleep: Moon,
  Mood: Sun,
  Energy: Zap,
  Anxiety: Activity,
  Wellbeing: Heart,
};

export const SEVERITY_COLORS: Record<string, string> = {
  minimal: "hsl(var(--accent))",
  mild: "hsl(var(--severity-mild))",
  moderate: "hsl(var(--severity-moderate))",
  severe: "hsl(var(--destructive))",
};

export const SLIDER_MIN = 0;
export const SLIDER_MAX = 10;
export const SLIDER_STEP = 0.2;

export const CLICK_THRESHOLD = 5;
export const LOCKOUT_DURATION_MS = 5000;
export const CLICK_WINDOW_MS = 2000;

export const DISCLAIMER_ACCEPTED_KEY = "moodly_disclaimer_accepted";
export const ONBOARDING_DONE_KEY = "moodly_onboarding_done";
