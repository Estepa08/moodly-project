export interface ParamIconConfig {
  parameterName: string;
  labelKey: string;
}

// ── Config ────────────────────────────────────────────────────────────
// One representative parameter per button; the actual value (0-10) is
// picked with a slider rather than a discrete icon per level.
// Icons themselves come from PARAM_ICONS in ../lib/constants, shared
// with the weekly averages grid so both stay in sync.

export const PARAM_ICON_CONFIGS: ParamIconConfig[] = [
  {
    parameterName: "Mood",
    labelKey: "dashboard.quickEntry.paramMood",
  },
  {
    parameterName: "Anxiety",
    labelKey: "dashboard.quickEntry.paramAnxiety",
  },
  {
    parameterName: "Sleep",
    labelKey: "dashboard.quickEntry.paramSleep",
  },
  {
    parameterName: "Energy",
    labelKey: "dashboard.quickEntry.paramEnergy",
  },
];
