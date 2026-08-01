import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useNavHighlights } from "../hooks/useNavHighlights";
import { useStalePractices } from "../hooks/useStalePractices";
import { PracticeSource } from "../features/gamification/practice.enums";
import { User, Sparkles, ChevronDown } from "lucide-react";
import { DASHBOARD_ITEM, PRACTICE_ITEMS, OTHER_ITEMS, ADMIN_ITEM } from "./nav-config";

const PATH_TO_SOURCE: Record<string, PracticeSource> = {
  "/practices/thought-journal": PracticeSource.ThoughtJournal,
  "/practices/gratitude": PracticeSource.Gratitude,
  "/practices/distortions": PracticeSource.Distortions,
  "/practices/sleep-hygiene": PracticeSource.SleepHygiene,
  "/practices/cost-benefit-analysis": PracticeSource.Cba,
  "/practices/breathing": PracticeSource.Breathing,
};

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: userData } = useCurrentUser();

  const highlights = useNavHighlights();
  const { isStale } = useStalePractices(3);

  const isPracticeActive =
    location.pathname === "/practices" ||
    PRACTICE_ITEMS.some((item) => location.pathname.startsWith(item.path));
  const [practicesOpen, setPracticesOpen] = useState(isPracticeActive);

  useEffect(() => {
    setPracticesOpen(isPracticeActive);
  }, [isPracticeActive]);

  const navButtonClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-[color,background-color,transform] duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      isActive
        ? "text-foreground font-semibold bg-secondary/50"
        : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
    }`;

  return (
    <nav
      aria-label={t("nav.dashboard")}
      className="hidden md:flex flex-col w-56 bg-card border-r border-border shadow-neumorphic-inset p-4 gap-2"
    >
      <div
        className="text-lg font-serif font-bold text-primary mb-4 px-3 text-balance"
        translate="no"
      >
        {t("common.moodly")}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl bg-muted/50 shadow-neumorphic-sm">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User aria-hidden="true" className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary truncate">{userData?.email ?? "—"}</p>
          <p className="text-xs text-muted-foreground truncate">{userData?.name ?? ""}</p>
        </div>
      </div>

      <Link
        to={DASHBOARD_ITEM.path}
        className={navButtonClass(location.pathname === "/")}
        aria-current={location.pathname === "/" ? "page" : undefined}
      >
        <DASHBOARD_ITEM.icon
          aria-hidden="true"
          className={`w-5 h-5 shrink-0 ${highlights.dashboard ? "text-primary" : ""}`}
        />
        <span className="text-sm font-medium truncate">{t(DASHBOARD_ITEM.labelKey)}</span>
      </Link>

      <button
        onClick={() => setPracticesOpen((o) => !o)}
        aria-expanded={practicesOpen}
        className={navButtonClass(isPracticeActive)}
      >
        <Sparkles
          aria-hidden="true"
          className={`w-5 h-5 shrink-0 ${highlights.practices ? "text-primary" : ""}`}
        />
        <span className="text-sm font-medium truncate flex-1 text-left">{t("nav.practices")}</span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 shrink-0 transition-transform duration-150 ${practicesOpen ? "rotate-180" : ""}`}
        />
      </button>

      {practicesOpen && (
        <div className="ml-4 pl-3 border-l border-border flex flex-col gap-1">
          {PRACTICE_ITEMS.map((item) => {
            const source = PATH_TO_SOURCE[item.path];
            return (
              <Link
                key={item.path}
                to={item.path}
                className={navButtonClass(location.pathname.startsWith(item.path))}
                aria-current={location.pathname === item.path ? "page" : undefined}
              >
                <item.icon
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 ${source && isStale(source) ? "text-primary" : ""}`}
                />
                <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      )}

      {OTHER_ITEMS.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={navButtonClass(location.pathname.startsWith(item.path))}
          aria-current={location.pathname === item.path ? "page" : undefined}
        >
          <item.icon
            aria-hidden="true"
            className={`w-5 h-5 shrink-0 ${item.path === "/tests" && highlights.tests ? "text-primary" : ""}`}
          />
          <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
        </Link>
      ))}

      {userData?.role === "admin" && (
        <Link
          to={ADMIN_ITEM.path}
          className={navButtonClass(location.pathname.startsWith(ADMIN_ITEM.path))}
          aria-current={location.pathname === ADMIN_ITEM.path ? "page" : undefined}
        >
          <ADMIN_ITEM.icon aria-hidden="true" className="w-5 h-5 shrink-0 text-primary" />
          <span className="text-sm font-medium truncate">{t(ADMIN_ITEM.labelKey)}</span>
        </Link>
      )}
    </nav>
  );
}
