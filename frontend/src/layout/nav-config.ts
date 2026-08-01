import {
  LayoutDashboard,
  Wind,
  Heart,
  BrainCircuit,
  Moon,
  Scale,
  ClipboardList,
  BarChart3,
  Settings,
  BookOpen,
  Trophy,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export const DASHBOARD_ITEM: NavItem = {
  labelKey: "nav.dashboard",
  path: "/",
  icon: LayoutDashboard,
};

export const PRACTICE_ITEMS: NavItem[] = [
  { labelKey: "nav.thoughtJournal", path: "/practices/thought-journal", icon: BookOpen },
  { labelKey: "nav.gratitude", path: "/practices/gratitude", icon: Heart },
  { labelKey: "nav.distortions", path: "/practices/distortions", icon: BrainCircuit },
  { labelKey: "nav.sleepHygiene", path: "/practices/sleep-hygiene", icon: Moon },
  { labelKey: "nav.cba", path: "/practices/cost-benefit-analysis", icon: Scale },
  { labelKey: "nav.breathing", path: "/practices/breathing", icon: Wind },
];

export const OTHER_ITEMS: NavItem[] = [
  { labelKey: "nav.progress", path: "/progress", icon: Trophy },
  { labelKey: "nav.tests", path: "/tests", icon: ClipboardList },
  { labelKey: "nav.results", path: "/results", icon: BarChart3 },
  { labelKey: "nav.settings", path: "/settings", icon: Settings },
];

export const ALL_MORE_ITEMS = [...PRACTICE_ITEMS, ...OTHER_ITEMS];

export const ADMIN_ITEM: NavItem = {
  labelKey: "nav.admin",
  path: "/admin",
  icon: ShieldCheck,
};
