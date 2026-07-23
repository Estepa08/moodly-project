export interface IconValue {
  value: number;
  labelKey: string;
  icon: React.ReactNode;
}

export interface ParamIconConfig {
  parameterName: string;
  icon: React.ReactNode;
  labelKey: string;
  values: IconValue[];
}

// Mood faces
const MoodVerySad = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8.5" cy="10" r="1" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1" fill="currentColor" />
    <path d="M6 17c1.5-2 4.5-2 6 0s4.5-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoodSad = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8.5" cy="10" r="1" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1" fill="currentColor" />
    <path d="M7.5 16.5c2-1 5-1 7 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoodNeutral = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8.5" cy="10" r="1" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1" fill="currentColor" />
    <path d="M8 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoodHappy = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8.5" cy="10" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="10" r="1.2" fill="currentColor" />
    <path d="M7.5 15c1.5 2 4.5 2 6 0s4.5-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoodVeryHappy = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8.5" cy="9.5" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="9.5" r="1.2" fill="currentColor" />
    <path d="M6 14c2 3 6 3.5 8 1s4 0 6-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Anxiety — wave patterns: calm → stormy
const AnxietyCalm = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M3 15c3-2 5 0 8 0s5-2 8 0c3 2 5 0 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <path d="M7 12c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M11 9c3-2 5 0 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AnxietySlight = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M3 15c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <path d="M5 11c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <path d="M8 7c3-2 5 0 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AnxietyModerate = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M3 15c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <path d="M4 11c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <path d="M6 7c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 4c2-1 3 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const AnxietyHigh = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M2 15c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <path d="M3 11c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M4 7c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M7 3.5c3-2 5 0 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AnxietyPanic = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M1 14c3-2 5 0 8 0s5-2 8 0" stroke="#ea1515" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    <path d="M2 10c3-2 5 0 8 0s5-2 8 0" stroke="#ea1515" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    <path d="M3 6c3-2 5 0 8 0s5-2 8 0" stroke="#ea1515" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M5 2.5c3-2 5 0 8 0" stroke="#ea1515" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Sleep — moon phases
const SleepAwful = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M12 3a9 9 0 1 0 9 9c-4 0-7-3-7-7 0-1 .3-2 .8-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const SleepPoor = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M12 3a9 9 0 1 0 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M16 4l-1 2 1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const SleepFair = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M12 5a7 7 0 1 0 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <path d="M15 3l-1 2 1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="17" cy="4" r="0.8" fill="currentColor" />
  </svg>
);

const SleepGood = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M12 5a7 7 0 1 0 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M15 3l-1 2 1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="17" cy="4" r="0.8" fill="currentColor" />
    <circle cx="14" cy="2" r="0.6" fill="currentColor" />
    <circle cx="17" cy="7" r="0.5" fill="currentColor" opacity="0.5" />
  </svg>
);

const SleepGreat = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
    <path d="M15 3l-1 2 1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="17" cy="4" r="0.8" fill="currentColor" />
    <circle cx="14" cy="2" r="0.6" fill="currentColor" />
    <circle cx="18" cy="2" r="0.5" fill="currentColor" />
    <circle cx="17" cy="7" r="0.5" fill="currentColor" opacity="0.5" />
    <circle cx="13" cy="4.5" r="0.4" fill="currentColor" opacity="0.7" />
  </svg>
);

// Energy — circles/battery
const EnergyExhausted = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    <path d="M12 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const EnergyLow = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <path d="M12 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M8 16c1.5-2 4.5-2 6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const EnergyModerate = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    <path d="M12 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 15c1.5-2 4.5-2 6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M16 15c1.5-2 4.5-2 6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const EnergyHigh = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
    <path d="M12 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 14c1.5-2 4.5-2 6 0s4.5-2 6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M8 10c2-1.5 4-1.5 6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const EnergyFull = (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <circle cx="12" cy="12" r="9" stroke="#059669" strokeWidth="1.5" fill="#059669" fillOpacity="0.1" />
    <path d="M12 2v4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 13c1.5-2 4.5-2 6 0s4.5-2 6 0" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M7 9c2-1.5 4-1.5 6 0s4-1.5 6 0" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

export const PARAM_ICON_CONFIGS: ParamIconConfig[] = [
  {
    parameterName: "Mood",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="10" r="1.2" fill="currentColor" />
        <circle cx="15.5" cy="10" r="1.2" fill="currentColor" />
        <path d="M7.5 15c1.5 2 4.5 2 6 0s4.5-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    labelKey: "dashboard.mood",
    values: [
      { value: 2, labelKey: "dashboard.quickEntrymoodVerySad", icon: MoodVerySad },
      { value: 4, labelKey: "dashboard.quickEntrymoodSad", icon: MoodSad },
      { value: 5, labelKey: "dashboard.quickEntrymoodNeutral", icon: MoodNeutral },
      { value: 7, labelKey: "dashboard.quickEntrymoodHappy", icon: MoodHappy },
      { value: 9, labelKey: "dashboard.quickEntrymoodVeryHappy", icon: MoodVeryHappy },
    ],
  },
  {
    parameterName: "Anxiety",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M4 11c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 7c3-2 5 0 8 0s5-2 8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    labelKey: "dashboard.anxiety",
    values: [
      { value: 2, labelKey: "dashboard.quickEntryanxietyCalm", icon: AnxietyCalm },
      { value: 4, labelKey: "dashboard.quickEntryanxietySlight", icon: AnxietySlight },
      { value: 5, labelKey: "dashboard.quickEntryanxietyModerate", icon: AnxietyModerate },
      { value: 7, labelKey: "dashboard.quickEntryanxietyHigh", icon: AnxietyHigh },
      { value: 9, labelKey: "dashboard.quickEntryanxietyPanic", icon: AnxietyPanic },
    ],
  },
  {
    parameterName: "Sleep",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 5a7 7 0 1 0 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 3l-1 2 1 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    labelKey: "dashboard.sleep",
    values: [
      { value: 2, labelKey: "dashboard.quickEntrysleepAwful", icon: SleepAwful },
      { value: 4, labelKey: "dashboard.quickEntrysleepPoor", icon: SleepPoor },
      { value: 5, labelKey: "dashboard.quickEntrysleepFair", icon: SleepFair },
      { value: 7, labelKey: "dashboard.quickEntrysleepGood", icon: SleepGood },
      { value: 9, labelKey: "dashboard.quickEntrysleepGreat", icon: SleepGreat },
    ],
  },
  {
    parameterName: "Energy",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 15c1.5-2 4.5-2 6 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    labelKey: "dashboard.energy",
    values: [
      { value: 2, labelKey: "dashboard.quickEntryenergyExhausted", icon: EnergyExhausted },
      { value: 4, labelKey: "dashboard.quickEntryenergyLow", icon: EnergyLow },
      { value: 5, labelKey: "dashboard.quickEntryenergyModerate", icon: EnergyModerate },
      { value: 7, labelKey: "dashboard.quickEntryenergyHigh", icon: EnergyHigh },
      { value: 9, labelKey: "dashboard.quickEntryenergyFull", icon: EnergyFull },
    ],
  },
];
