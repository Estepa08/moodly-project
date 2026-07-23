import { Moon, Sun, Zap, Heart, type LucideIcon } from "lucide-react";

export const PARAM_NAME_KEYS: Record<string, string> = {
  Anxiety: "dashboard.anxiety",
  Sleep: "dashboard.sleep",
  Mood: "dashboard.mood",
  Energy: "dashboard.energy",
  Gratitude: "dashboard.gratitude",
  "Sleep Hygiene": "dashboard.sleepHygiene",
  "Distortion Quiz": "dashboard.distortionQuiz",
  Wellbeing: "dashboard.wellbeing",
};

// Non-standard-scale parameters that don't belong in the 0-10 numeric trend chart / averages / quick-entry slider.
export const TEXT_PARAMS = new Set(["Gratitude", "Sleep Hygiene", "Distortion Quiz"]);

export const PARAM_COLORS: Record<string, string> = {
  Anxiety: "hsl(var(--primary))",
  Sleep: "hsl(var(--param-sleep))",
  Mood: "hsl(270 50% 60%)",
  Energy: "hsl(var(--param-energy))",
};

export const PARAM_ICONS: Record<string, LucideIcon> = {
  Sleep: Moon,
  Mood: Sun,
  Energy: Zap,
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
