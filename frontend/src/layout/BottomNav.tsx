import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useNavHighlights } from "../hooks/useNavHighlights";
import {
  LayoutDashboard,
  BookHeart,
  ClipboardList,
  BarChart3,
  Trophy,
  MoreHorizontal,
} from "lucide-react";

const NAV_ITEMS = [
  { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
  { labelKey: "nav.thoughtJournal", path: "/practices/thought-journal", icon: BookHeart },
  { labelKey: "nav.progress", path: "/progress", icon: Trophy },
  { labelKey: "nav.tests", path: "/tests", icon: ClipboardList },
  { labelKey: "nav.results", path: "/results", icon: BarChart3 },
];

interface BottomNavProps {
  onMoreOpen: () => void;
  isMoreActive?: boolean;
}

export default function BottomNav({ onMoreOpen, isMoreActive }: BottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const highlights = useNavHighlights();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const iconClass = (path: string, base: string) => {
    const highlight =
      path === "/"
        ? highlights.dashboard
        : path === "/tests"
          ? highlights.tests
          : false;
    return cn(base, highlight && "text-primary");
  };

  return (
    <nav
      aria-label={t("nav.dashboard")}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card shadow-elevation-4 rounded-t-xl px-1 pt-2 flex items-center justify-around"
      style={{ paddingBottom: "calc(0.5rem + var(--sab))" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-[color,background-color,transform] duration-150 min-w-0 flex-1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-secondary/40 shadow-elevation-inset text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-secondary/20",
            )}
          >
            <item.icon aria-hidden="true" className={iconClass(item.path, "w-5 h-5 shrink-0")} />
            <span className="text-[11px] font-medium leading-tight truncate">
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
      <button
        onClick={onMoreOpen}
        className={cn(
          "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-[color,background-color,transform] duration-150 cursor-pointer min-w-0 flex-1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMoreActive
            ? "bg-secondary/40 shadow-elevation-inset text-primary"
            : "text-muted-foreground hover:text-primary hover:bg-secondary/20",
        )}
      >
        <MoreHorizontal aria-hidden="true" className="w-5 h-5 shrink-0" />
        <span className="text-[11px] font-medium leading-tight">{t("nav.more")}</span>
      </button>
    </nav>
  );
}
