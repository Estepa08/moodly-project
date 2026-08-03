import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useNavHighlights } from "../hooks/useNavHighlights";
import { BOTTOM_NAV_ITEMS } from "./nav-config";

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const highlights = useNavHighlights();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const iconClass = (path: string, base: string) => {
    const highlight =
      path === "/" ? highlights.dashboard : path === "/tests" ? highlights.tests : false;
    return cn(base, highlight && "text-primary");
  };

  return (
    <nav
      aria-label={t("nav.main")}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card shadow-elevation-4 rounded-t-xl px-1 pt-2 flex items-center justify-around"
      style={{ paddingBottom: "calc(0.5rem + var(--sab))" }}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 rounded-xl transition-[color,background-color,transform] duration-150 min-w-0 flex-1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-secondary/20",
            )}
          >
            <item.icon
              aria-hidden="true"
              className={cn("w-6 h-6 shrink-0", active && "text-primary", iconClass(item.path, ""))}
            />
            <span className="text-xs font-medium leading-tight truncate">{t(item.shortLabelKey ?? item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
