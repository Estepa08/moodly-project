import { LayoutDashboard, Wind, Heart, BrainCircuit, Moon, Scale, ClipboardList, BarChart3, FileText, MessageSquare, type LucideIcon } from "lucide-react";

export interface NavItem {
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export const DASHBOARD_ITEM: NavItem = { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard };

export const PRACTICE_ITEMS: NavItem[] = [
  { labelKey: "nav.breathing", path: "/breathing", icon: Wind },
  { labelKey: "nav.gratitude", path: "/gratitude-journal", icon: Heart },
  { labelKey: "nav.distortions", path: "/distortions", icon: BrainCircuit },
  { labelKey: "nav.sleepHygiene", path: "/sleep-hygiene", icon: Moon },
  { labelKey: "nav.cba", path: "/cost-benefit-analysis", icon: Scale },
];

export const OTHER_ITEMS: NavItem[] = [
  { labelKey: "nav.tests", path: "/tests", icon: ClipboardList },
  { labelKey: "nav.results", path: "/results", icon: BarChart3 },
  { labelKey: "nav.reports", path: "/reports", icon: FileText },
  { labelKey: "nav.feedback", path: "/feedback", icon: MessageSquare },
];

export const ALL_MORE_ITEMS = [...PRACTICE_ITEMS, ...OTHER_ITEMS];
