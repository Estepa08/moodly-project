import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useCreatureState } from "../features/gamification";
import { SkipLink } from "../widgets";
import { StreakIndicator } from "../features/gamification";
import Sidebar from "../layout/Sidebar";
import LayoutModals from "../layout/LayoutModals";
import BottomNav from "../layout/BottomNav";
import Breadcrumbs from "../components/ui/breadcrumbs";
import { PRACTICE_ITEMS, OTHER_ITEMS, ALL_MORE_ITEMS, ADMIN_ITEM } from "../layout/nav-config";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { data: userData } = useCurrentUser();
  const isReducedMotion = useReducedMotion();
  const { data: creature } = useCreatureState();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  if (isBootstrapping) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isMoreActive = ALL_MORE_ITEMS.some((item) => location.pathname.startsWith(item.path));

  return (
    <div className="flex min-h-screen bg-background">
      <SkipLink />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`sticky top-0 z-10 bg-card/80 mx-4 mt-4 mb-2 rounded-xl shadow-neumorphic px-5 py-3 flex items-center justify-between ${
            isReducedMotion ? "" : "backdrop-blur-md"
          }`}
          style={{ paddingTop: "calc(0.75rem + var(--sat))" }}
        >
          <h1 className="text-lg font-semibold text-primary font-serif text-balance" translate="no">
            {t("common.moodly")}
          </h1>
          <div className="flex items-center gap-2">
            {creature && <StreakIndicator streak={creature.streak} />}
            <div className="flex items-center gap-1 text-xs">
              <button
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-[color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i18n.language === "en" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => i18n.changeLanguage("en")}
              >
                {t("common.languageEn")}
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-[color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i18n.language === "ru" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => i18n.changeLanguage("ru")}
              >
                {t("common.languageRu")}
              </button>
            </div>
          </div>
        </header>

        <Breadcrumbs />

        <main
          id="main-content"
          className="flex-1 px-4 space-y-4 md:pb-8"
          style={{ paddingBottom: "calc(2rem + var(--sab))" }}
        >
          <div aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announcements" />
          {children}
        </main>

        <div className="md:hidden relative z-50">
          {mobileMoreOpen && (
            <>
              <div
                className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
                onClick={() => setMobileMoreOpen(false)}
                aria-hidden="true"
              />
              <div className="fixed bottom-[calc(4rem+var(--sab))] left-2 right-2 z-50 bg-card rounded-xl shadow-elevation-3 p-2 flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground px-3 pt-2 pb-1">
                  {t("nav.practices")}
                </p>
                {PRACTICE_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-[color,background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      location.pathname.startsWith(item.path)
                        ? "text-primary font-medium bg-secondary/30"
                        : "text-foreground hover:bg-secondary/30"
                    }`}
                  >
                    <item.icon aria-hidden="true" className="w-5 h-5 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                ))}
                <div className="h-px bg-border mx-3 my-1" />
                <p className="text-xs font-medium text-muted-foreground px-3 pt-1 pb-1">
                  {t("nav.more")}
                </p>
                {OTHER_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-[color,background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      location.pathname.startsWith(item.path)
                        ? "text-primary font-medium bg-secondary/30"
                        : "text-foreground hover:bg-secondary/30"
                    }`}
                  >
                    <item.icon aria-hidden="true" className="w-5 h-5 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                ))}
                {userData?.role === "admin" && (
                  <Link
                    to={ADMIN_ITEM.path}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-[color,background-color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      location.pathname.startsWith(ADMIN_ITEM.path)
                        ? "text-primary font-medium bg-secondary/30"
                        : "text-foreground hover:bg-secondary/30"
                    }`}
                  >
                    <ADMIN_ITEM.icon aria-hidden="true" className="w-5 h-5 shrink-0" />
                    {t(ADMIN_ITEM.labelKey)}
                  </Link>
                )}
              </div>
            </>
          )}
          <BottomNav onMoreOpen={() => setMobileMoreOpen((o) => !o)} isMoreActive={isMoreActive} />
        </div>

        <LayoutModals />
      </div>
    </div>
  );
}
