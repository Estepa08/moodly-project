import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Wind,
  ClipboardList,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";

const NAV_ITEMS = [
  { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
  { labelKey: "nav.practices", path: "/practices", icon: Wind },
  { labelKey: "nav.tests", path: "/tests", icon: ClipboardList },
  { labelKey: "nav.results", path: "/results", icon: BarChart3 },
];

interface BottomNavProps {
  onMoreOpen: () => void;
  isMoreActive?: boolean;
}

export default function BottomNav({ onMoreOpen, isMoreActive }: BottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
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
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-150 cursor-pointer min-w-0 flex-1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-secondary/40 shadow-elevation-inset text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-secondary/20",
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-medium leading-tight truncate">
              {t(item.labelKey)}
            </span>
          </button>
        );
      })}
      <button
        onClick={onMoreOpen}
        className={cn(
          "flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-150 cursor-pointer min-w-0 flex-1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMoreActive
            ? "bg-secondary/40 shadow-elevation-inset text-primary"
            : "text-muted-foreground hover:text-primary hover:bg-secondary/20",
        )}
      >
        <MoreHorizontal className="w-5 h-5 shrink-0" />
        <span className="text-[11px] font-medium leading-tight">{t("nav.more")}</span>
      </button>
    </nav>
  );
}
