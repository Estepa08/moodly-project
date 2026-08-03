import {
  LayoutDashboard,
  Wind,
  Heart,
  BrainCircuit,
  Moon,
  Scale,
  ClipboardList,
  Settings,
  BookOpen,
  Trophy,
  ShieldCheck,
  User,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  labelKey: string;
  shortLabelKey?: string;
  path: string;
  icon: LucideIcon;
}

export const DASHBOARD_ITEM: NavItem = {
  labelKey: "nav.dashboard",
  shortLabelKey: "nav.short.dashboard",
  path: "/",
  icon: LayoutDashboard,
};

export const PRACTICE_ITEMS: NavItem[] = [
  {
    labelKey: "nav.thoughtJournal",
    shortLabelKey: "nav.short.thoughtJournal",
    path: "/practices/thought-journal",
    icon: BookOpen,
  },
  {
    labelKey: "nav.gratitude",
    shortLabelKey: "nav.short.gratitude",
    path: "/practices/gratitude",
    icon: Heart,
  },
  {
    labelKey: "nav.distortions",
    shortLabelKey: "nav.short.distortions",
    path: "/practices/distortions",
    icon: BrainCircuit,
  },
  {
    labelKey: "nav.sleepHygiene",
    shortLabelKey: "nav.short.sleepHygiene",
    path: "/practices/sleep-hygiene",
    icon: Moon,
  },
  {
    labelKey: "nav.cba",
    shortLabelKey: "nav.short.cba",
    path: "/practices/cost-benefit-analysis",
    icon: Scale,
  },
  {
    labelKey: "nav.breathing",
    shortLabelKey: "nav.short.breathing",
    path: "/practices/breathing",
    icon: Wind,
  },
];

export const OTHER_ITEMS: NavItem[] = [
  {
    labelKey: "nav.progress",
    shortLabelKey: "nav.short.progress",
    path: "/progress",
    icon: Trophy,
  },
  { labelKey: "nav.tests", shortLabelKey: "nav.short.tests", path: "/tests", icon: ClipboardList },
  {
    labelKey: "nav.settings",
    shortLabelKey: "nav.short.settings",
    path: "/settings",
    icon: Settings,
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  DASHBOARD_ITEM,
  {
    labelKey: "nav.practices",
    shortLabelKey: "nav.short.practices",
    path: "/practices",
    icon: Sparkles,
  },
  { labelKey: "nav.tests", shortLabelKey: "nav.short.tests", path: "/tests", icon: ClipboardList },
  {
    labelKey: "nav.progress",
    shortLabelKey: "nav.short.progress",
    path: "/progress",
    icon: Trophy,
  },
  { labelKey: "nav.profile", shortLabelKey: "nav.short.profile", path: "/settings", icon: User },
];

export const ADMIN_ITEM: NavItem = {
  labelKey: "nav.admin",
  shortLabelKey: "nav.short.admin",
  path: "/admin",
  icon: ShieldCheck,
};
