import type { LucideIcon } from "lucide-react";
import {
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Brain,
  CloudMoon,
  CloudMoonRain,
  CloudRain,
  CloudSun,
  CloudSunRain,
  Moon,
  MoonStar,
  Sun,
  SunMedium,
  Sunrise,
} from "lucide-react";
import { ParameterName } from "./constants";

export interface RatingLevel {
  value: number;
  labelKey: string;
  Icon: LucideIcon;
  bolts?: number;
}

export const RATING_LEVELS: Partial<Record<ParameterName, RatingLevel[]>> = {
  [ParameterName.Mood]: [
    { value: 0, labelKey: "rating.mood.0", Icon: CloudRain },
    { value: 2.5, labelKey: "rating.mood.25", Icon: CloudSunRain },
    { value: 5, labelKey: "rating.mood.5", Icon: CloudSun },
    { value: 7.5, labelKey: "rating.mood.75", Icon: SunMedium },
    { value: 10, labelKey: "rating.mood.10", Icon: Sun },
  ],
  [ParameterName.Sleep]: [
    { value: 0, labelKey: "rating.sleep.0", Icon: CloudMoonRain },
    { value: 2.5, labelKey: "rating.sleep.25", Icon: CloudMoon },
    { value: 5, labelKey: "rating.sleep.5", Icon: Moon },
    { value: 7.5, labelKey: "rating.sleep.75", Icon: MoonStar },
    { value: 10, labelKey: "rating.sleep.10", Icon: Sunrise },
  ],
  [ParameterName.Energy]: [
    { value: 0, labelKey: "rating.energy.0", Icon: BatteryWarning },
    { value: 2.5, labelKey: "rating.energy.25", Icon: BatteryLow },
    { value: 5, labelKey: "rating.energy.5", Icon: BatteryMedium },
    { value: 7.5, labelKey: "rating.energy.75", Icon: BatteryFull },
    { value: 10, labelKey: "rating.energy.10", Icon: BatteryCharging },
  ],
  [ParameterName.Anxiety]: [
    { value: 0, labelKey: "rating.anxiety.0", Icon: Brain, bolts: 0 },
    { value: 2.5, labelKey: "rating.anxiety.25", Icon: Brain, bolts: 1 },
    { value: 5, labelKey: "rating.anxiety.5", Icon: Brain, bolts: 2 },
    { value: 7.5, labelKey: "rating.anxiety.75", Icon: Brain, bolts: 3 },
    { value: 10, labelKey: "rating.anxiety.10", Icon: Brain, bolts: 4 },
  ],
};

export function levelForValue(levels: RatingLevel[], value: number): RatingLevel {
  return levels.reduce((acc, l) =>
    Math.abs(l.value - value) < Math.abs(acc.value - value) ? l : acc,
  );
}
