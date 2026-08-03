import { useTranslation } from "react-i18next";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { SyncStatusIndicator } from "./SyncStatusIndicator";
import { SkipLink } from "../widgets";
import { Button } from "../components/ui/button";
import Sidebar from "../layout/Sidebar";
import LayoutModals from "../layout/LayoutModals";
import BottomNav from "../layout/BottomNav";
import FloatingCompanion from "../features/gamification/FloatingCompanion";
import Breadcrumbs from "../components/ui/breadcrumbs";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping, logout } = useAuth();
  const isReducedMotion = useReducedMotion();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (isBootstrapping) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

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
            <SyncStatusIndicator />
            <Button
              variant="outline"
              onClick={handleLogout}
              aria-label={t("common.logout")}
              className="h-9 md:h-10 px-2.5 md:px-4 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
            >
              <LogOut aria-hidden="true" />
              <span className="hidden md:inline">{t("common.logout")}</span>
            </Button>
          </div>
        </header>

        <Breadcrumbs />

        <main
          id="main-content"
          className="flex-1 px-4 space-y-4 pb-[calc(5.5rem+var(--sab))] md:pb-8"
        >
          <div aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announcements" />
          {children}
        </main>

        <footer className="px-6 pb-6 md:pb-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground">{t("common.footerText")}</p>
          <p className="text-xs text-muted-foreground">
            © 2026{" "}
            <span className="inline-flex items-center gap-1">
              <span>{t("common.footerDivider")}</span>
              <Link to="/privacy" className="text-primary hover:underline">
                {t("common.footerPrivacy")}
              </Link>
              <span>{t("common.footerDivider")}</span>
              <Link to="/terms" className="text-primary hover:underline">
                {t("common.footerTerms")}
              </Link>
            </span>
          </p>
        </footer>

        <div className="md:hidden relative z-40">
          <BottomNav />
        </div>

        <FloatingCompanion />
        <LayoutModals />
      </div>
    </div>
  );
}
