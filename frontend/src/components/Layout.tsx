import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileText,
  MessageSquare,
  LogOut,
  User,
  Wind,
} from "lucide-react";

const navItems = [
  { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
  { labelKey: "nav.breathing", path: "/breathing", icon: Wind },
  { labelKey: "nav.tests", path: "/tests", icon: ClipboardList },
  { labelKey: "nav.results", path: "/results", icon: BarChart3 },
  { labelKey: "nav.reports", path: "/reports", icon: FileText },
  { labelKey: "nav.feedback", path: "/feedback", icon: MessageSquare },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const { data: userData } = useQuery<{ id: string; email: string; name?: string }>({
    queryKey: ["userMe"],
    queryFn: () => api.users.me() as Promise<{ id: string; email: string; name?: string }>,
  });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border shadow-neumorphic-inset p-4 gap-2">
        <div className="text-lg font-serif font-bold text-primary mb-4 px-3">{t("common.moodly")}</div>
        <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl bg-muted/50 shadow-neumorphic-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary truncate">{userData?.name ?? userData?.email ?? "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{userData?.email ?? ""}</p>
          </div>
        </div>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              location.pathname === item.path
                ? "text-foreground font-semibold bg-secondary/50"
                : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{t(item.labelKey)}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t("common.logout")}</span>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md mx-4 mt-4 mb-2 rounded-xl shadow-neumorphic px-5 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-primary font-serif">{t("common.moodly")}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs md:hidden">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`p-1.5 rounded-lg hover:bg-secondary/50 transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i18n.language === "en" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => i18n.changeLanguage("en")}
              >
                {t("common.languageEn")}
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i18n.language === "ru" ? "text-primary font-semibold" : "text-muted-foreground"}`}
                onClick={() => i18n.changeLanguage("ru")}
              >
                {t("common.languageRu")}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-8 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}
