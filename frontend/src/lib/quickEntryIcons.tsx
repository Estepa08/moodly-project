import type { ReactNode } from "react";
import { Smile, Activity, Moon, BatteryMedium } from "lucide-react";

export interface ParamIconConfig {
  parameterName: string;
  icon: ReactNode;
  labelKey: string;
}

// ── Config ────────────────────────────────────────────────────────────
// One representative icon per parameter; the actual value (0-10) is
// picked with a slider rather than a discrete icon per level.

export const PARAM_ICON_CONFIGS: ParamIconConfig[] = [
  {
    parameterName: "Mood",
    icon: <Smile className="w-8 h-8" strokeWidth={1.75} opacity={0.7} />,
    labelKey: "dashboard.quickEntry.paramMood",
  },
  {
    parameterName: "Anxiety",
    icon: <Activity className="w-8 h-8" strokeWidth={1.75} opacity={0.7} />,
    labelKey: "dashboard.quickEntry.paramAnxiety",
  },
  {
    parameterName: "Sleep",
    icon: <Moon className="w-8 h-8" strokeWidth={1.75} opacity={0.7} />,
    labelKey: "dashboard.quickEntry.paramSleep",
  },
  {
    parameterName: "Energy",
    icon: <BatteryMedium className="w-8 h-8" strokeWidth={1.75} opacity={0.55} />,
    labelKey: "dashboard.quickEntry.paramEnergy",
  },
];
