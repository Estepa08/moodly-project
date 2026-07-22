import { Moon, Sun, Zap, Eye, type LucideIcon } from "lucide-react";

export const PARAM_NAME_KEYS: Record<string, string> = {
  Anxiety: "dashboard.anxiety",
  Sleep: "dashboard.sleep",
  Mood: "dashboard.mood",
  Energy: "dashboard.energy",
  Focus: "dashboard.focus",
};

export const PARAM_COLORS: Record<string, string> = {
  Anxiety: "hsl(var(--primary))",
  Sleep: "hsl(var(--param-sleep))",
  Mood: "hsl(var(--accent))",
  Energy: "hsl(var(--param-energy))",
  Focus: "hsl(var(--param-focus))",
};

export const PARAM_ICONS: Record<string, LucideIcon> = {
  Sleep: Moon,
  Mood: Sun,
  Energy: Zap,
  Focus: Eye,
};

export const SEVERITY_COLORS: Record<string, string> = {
  minimal: "hsl(var(--accent))",
  mild: "hsl(var(--severity-mild))",
  moderate: "hsl(var(--severity-moderate))",
  severe: "hsl(var(--destructive))",
};

export const SLIDER_MIN = 0;
export const SLIDER_MAX = 10;
export const SLIDER_STEP = 0.5;

export const CLICK_THRESHOLD = 5;
export const LOCKOUT_DURATION_MS = 5000;
export const CLICK_WINDOW_MS = 2000;
