import type { ReactNode } from "react";

export interface IconValue {
  value: number;
  labelKey: string;
  icon: ReactNode;
}

export interface ParamIconConfig {
  parameterName: string;
  icon: ReactNode;
  labelKey: string;
  values: IconValue[];
}

// ── Mood: circle fill (pie segments, non-judgmental) ──────────────────
// Progression: empty → 25% → 50% → 75% → full

const MoodMinimal = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
  </svg>
);

const MoodSlight = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35" />
    <path d="M12 12 L12 4.5 A7.5 7.5 0 0 1 19.5 12 Z" fill="currentColor" opacity="0.25" />
  </svg>
);

const MoodModerate = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
    <path d="M12 12 L12 4.5 A7.5 7.5 0 0 1 12 19.5 Z" fill="currentColor" opacity="0.25" />
  </svg>
);

const MoodNoticeable = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.65" />
    <path d="M12 12 L12 4.5 A7.5 7.5 0 0 1 19.5 12 A7.5 7.5 0 0 1 12 19.5 A7.5 7.5 0 0 1 4.5 12 Z" fill="currentColor" opacity="0.25" />
  </svg>
);

const MoodFull = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.12" />
  </svg>
);

// ── Anxiety: multiple waves, oscillation count grows ─────────────────
// Progression: gentle curve → 1 wave → 1.5 → 2 → 2.5 + chaotic overlay

const AnxietyMinimal = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M3 14 Q8 11 13 14 Q18 17 21 14" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.3" />
  </svg>
);

const AnxietySlight = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M3 14 Q8 6 13 14 Q18 22 21 14" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const AnxietyModerate = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M3 14 Q7 5 11 14 Q15 23 19 14 Q21 8 22 11" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.65" />
  </svg>
);

const AnxietyStrong = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M3 14 Q6 4 9 14 Q12 24 15 14 Q18 4 21 14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />
  </svg>
);

const AnxietyVeryStrong = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M3 14 Q6 4 9 14 Q12 24 15 14 Q18 4 21 14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="1" />
  </svg>
);

// ── Sleep: moon phases (crescent via bezier, neutral) ────────────────
// Progression: new → thin crescent → half → gibbous → full + stars

const SleepMinimal = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
  </svg>
);

const SleepSlight = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35" />
    <path d="M12 4 C16 4 20 8 20 12 C20 16 16 20 12 20 C14.5 20 16 16.5 16 12 C16 7.5 14.5 4 12 4 Z" fill="currentColor" opacity="0.25" />
  </svg>
);

const SleepModerate = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
    <path d="M12 4 A8 8 0 0 1 12 20 Z" fill="currentColor" opacity="0.25" />
  </svg>
);

const SleepNoticeable = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.65" />
    <path d="M12 4 C17 4 20 7.5 20 12 C20 16.5 17 20 12 20 C13.5 20 15 17 15 12 C15 7 13.5 4 12 4 Z" fill="currentColor" opacity="0.25" />
  </svg>
);

const SleepFull = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.1" />
    <circle cx="15" cy="4.5" r="0.9" fill="currentColor" opacity="0.5" />
    <circle cx="18" cy="8.5" r="0.7" fill="currentColor" opacity="0.4" />
    <circle cx="17" cy="14" r="0.6" fill="currentColor" opacity="0.3" />
    <circle cx="14.5" cy="17" r="0.5" fill="currentColor" opacity="0.25" />
    <circle cx="8" cy="6" r="0.5" fill="currentColor" opacity="0.2" />
  </svg>
);

// ── Energy: lightning bolt (non-judgmental charge level) ─────────────
// Progression: outline → faint fill → medium → strong → full + sparks

const EnergyMinimal = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M15 5 L9 12 L14 12 L10 20 L19 11 L14 11 Z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" opacity="0.2" />
  </svg>
);

const EnergySlight = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M15 5 L9 12 L14 12 L10 20 L19 11 L14 11 Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.1" strokeLinejoin="round" opacity="0.35" />
  </svg>
);

const EnergyModerate = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M15 5 L9 12 L14 12 L10 20 L19 11 L14 11 Z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round" opacity="0.55" />
  </svg>
);

const EnergyNoticeable = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M15 5 L9 12 L14 12 L10 20 L19 11 L14 11 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3" strokeLinejoin="round" opacity="0.75" />
  </svg>
);

const EnergyFull = (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path d="M15 5 L9 12 L14 12 L10 20 L19 11 L14 11 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.35" strokeLinejoin="round" opacity="1" />
    <path d="M17 3 Q19 3 19.5 5" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />
    <path d="M16.5 19 Q17 21 18 21" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
    <path d="M7 9 Q6 8.5 6.5 7.5" stroke="currentColor" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.35" />
  </svg>
);

// ── Config ────────────────────────────────────────────────────────────

export const PARAM_ICON_CONFIGS: ParamIconConfig[] = [
  {
    parameterName: "Mood",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35" />
      </svg>
    ),
    labelKey: "dashboard.quickEntry.paramMood",
    values: [
      { value: 2, labelKey: "dashboard.quickEntry.moodMinimal", icon: MoodMinimal },
      { value: 4, labelKey: "dashboard.quickEntry.moodSlight", icon: MoodSlight },
      { value: 5, labelKey: "dashboard.quickEntry.moodModerate", icon: MoodModerate },
      { value: 7, labelKey: "dashboard.quickEntry.moodNoticeable", icon: MoodNoticeable },
      { value: 9, labelKey: "dashboard.quickEntry.moodFull", icon: MoodFull },
    ],
  },
  {
    parameterName: "Anxiety",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M4 14 Q8 10 12 14 Q16 18 20 14" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.55" />
      </svg>
    ),
    labelKey: "dashboard.quickEntry.paramAnxiety",
    values: [
      { value: 2, labelKey: "dashboard.quickEntry.anxietyMinimal", icon: AnxietyMinimal },
      { value: 4, labelKey: "dashboard.quickEntry.anxietySlight", icon: AnxietySlight },
      { value: 5, labelKey: "dashboard.quickEntry.anxietyModerate", icon: AnxietyModerate },
      { value: 7, labelKey: "dashboard.quickEntry.anxietyStrong", icon: AnxietyStrong },
      { value: 9, labelKey: "dashboard.quickEntry.anxietyVeryStrong", icon: AnxietyVeryStrong },
    ],
  },
  {
    parameterName: "Sleep",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M12 4 C16 4 19 7.5 19 12 C19 16.5 16 20 12 20 C14 20 15.5 16.5 15.5 12 C15.5 7.5 14 4 12 4 Z" fill="currentColor" opacity="0.3" />
      </svg>
    ),
    labelKey: "dashboard.quickEntry.paramSleep",
    values: [
      { value: 2, labelKey: "dashboard.quickEntry.sleepMinimal", icon: SleepMinimal },
      { value: 4, labelKey: "dashboard.quickEntry.sleepSlight", icon: SleepSlight },
      { value: 5, labelKey: "dashboard.quickEntry.sleepModerate", icon: SleepModerate },
      { value: 7, labelKey: "dashboard.quickEntry.sleepNoticeable", icon: SleepNoticeable },
      { value: 9, labelKey: "dashboard.quickEntry.sleepFull", icon: SleepFull },
    ],
  },
  {
    parameterName: "Energy",
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path d="M15 5 L9 12 L14 12 L10 20 L19 11 L14 11 Z" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round" opacity="0.45" />
      </svg>
    ),
    labelKey: "dashboard.quickEntry.paramEnergy",
    values: [
      { value: 2, labelKey: "dashboard.quickEntry.energyMinimal", icon: EnergyMinimal },
      { value: 4, labelKey: "dashboard.quickEntry.energySlight", icon: EnergySlight },
      { value: 5, labelKey: "dashboard.quickEntry.energyModerate", icon: EnergyModerate },
      { value: 7, labelKey: "dashboard.quickEntry.energyNoticeable", icon: EnergyNoticeable },
      { value: 9, labelKey: "dashboard.quickEntry.energyFull", icon: EnergyFull },
    ],
  },
];
