import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useCurrentUser } from "../hooks/useCurrentUser";
import Lottie from "lottie-react";
import creatureAnimation from "../assets/lottie/breathing-creature.json";
import SkipLink from "./SkipLink";
import CrisisDialog from "./CrisisDialog";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileText,
  MessageSquare,
  LogOut,
  User,
  Wind,
  Heart,
  BrainCircuit,
  Moon,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  PhoneCall,
} from "lucide-react";

const DASHBOARD_ITEM = { labelKey: "nav.dashboard", path: "/", icon: LayoutDashboard };

const PRACTICE_ITEMS = [
  { labelKey: "nav.breathing", path: "/breathing", icon: Wind },
  { labelKey: "nav.gratitude", path: "/gratitude-journal", icon: Heart },
  { labelKey: "nav.distortions", path: "/distortions", icon: BrainCircuit },
  { labelKey: "nav.sleepHygiene", path: "/sleep-hygiene", icon: Moon },
];

const OTHER_ITEMS = [
  { labelKey: "nav.tests", path: "/tests", icon: ClipboardList },
  { labelKey: "nav.results", path: "/results", icon: BarChart3 },
  { labelKey: "nav.reports", path: "/reports", icon: FileText },
  { labelKey: "nav.feedback", path: "/feedback", icon: MessageSquare },
];

const ALL_NAV_ITEMS = [DASHBOARD_ITEM, ...PRACTICE_ITEMS, ...OTHER_ITEMS];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isReducedMotion = useReducedMotion();
  const { data: userData } = useCurrentUser();
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [showCreature, setShowCreature] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [prevWasCreature, setPrevWasCreature] = useState(true);

  const puddleCircles = useMemo(() => {
    const circles: { id: number; tx: number; ty: number; delay: number; size: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const rx = 10 + Math.random() * 14;
      const ry = 3 + Math.random() * 7;
      circles.push({
        id: i,
        tx: Math.cos(angle) * rx,
        ty: Math.sin(angle) * ry,
        delay: Math.random() * 0.15,
        size: 4 + Math.random() * 6,
      });
    }
    return circles;
  }, []);

  const isPracticeActive = PRACTICE_ITEMS.some((item) => location.pathname.startsWith(item.path));
  const [practicesOpen, setPracticesOpen] = useState(isPracticeActive);

  useEffect(() => {
    if (isPracticeActive) setPracticesOpen(true);
  }, [isPracticeActive]);

  useEffect(() => {
    if (isReducedMotion) return;
    const CYCLE_MS = 5000;
    const TRANSITION_MS = 1600;
    const id = setInterval(() => {
      setPrevWasCreature(showCreature);
      setAnimKey((k) => k + 1);
      setTransitioning(true);
      setTimeout(() => setShowCreature((c) => !c), TRANSITION_MS * 0.45);
      setTimeout(() => setTransitioning(false), TRANSITION_MS);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [isReducedMotion, showCreature]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navButtonClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      isActive
        ? "text-foreground font-semibold bg-secondary/50"
        : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
    }`;

  return (
    <div className="flex min-h-screen bg-background">
      <SkipLink />
      <nav aria-label={t("nav.dashboard")} className="hidden md:flex flex-col w-56 bg-card border-r border-border shadow-neumorphic-inset p-4 gap-2">
        <div className="text-lg font-serif font-bold text-primary mb-4 px-3">{t("common.moodly")}</div>
        <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl bg-muted/50 shadow-neumorphic-sm">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary truncate">{userData?.name ?? userData?.email ?? "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{userData?.email ?? ""}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("common.logout")}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => navigate(DASHBOARD_ITEM.path)}
          className={navButtonClass(location.pathname === "/")}
        >
          <DASHBOARD_ITEM.icon className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium truncate">{t(DASHBOARD_ITEM.labelKey)}</span>
        </button>

        <button
          onClick={() => setPracticesOpen((o) => !o)}
          aria-expanded={practicesOpen}
          className={navButtonClass(isPracticeActive)}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium truncate flex-1 text-left">{t("nav.practices")}</span>
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-150 ${practicesOpen ? "rotate-180" : ""}`} />
        </button>
        {practicesOpen && (
          <div className="ml-4 pl-3 border-l border-border flex flex-col gap-1">
            {PRACTICE_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={navButtonClass(location.pathname.startsWith(item.path))}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
              </button>
            ))}
          </div>
        )}

        {OTHER_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={navButtonClass(location.pathname.startsWith(item.path))}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`sticky top-0 z-10 bg-card/80 mx-4 mt-4 mb-2 rounded-xl shadow-neumorphic px-5 py-3 flex items-center justify-between ${isReducedMotion ? "" : "backdrop-blur-md"}`}>
          <div className="flex-1 relative h-9 overflow-hidden">
            <div
              className={`absolute inset-0 flex items-center ${
                transitioning
                  ? prevWasCreature ? 'animate-creature-melt' : 'animate-creature-rise'
                  : showCreature ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden={!showCreature && !transitioning}
            >
              <div className={`w-9 h-9 ${showCreature && !isReducedMotion && !transitioning ? 'animate-header-drift' : ''}`}>
                <Lottie
                  animationData={creatureAnimation}
                  loop
                  autoplay={!isReducedMotion}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
            <h1
              className={`absolute inset-0 flex items-center text-lg font-semibold text-primary font-serif ${
                transitioning
                  ? prevWasCreature ? 'animate-text-rise' : 'animate-text-melt'
                  : !showCreature ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              aria-hidden={showCreature && !transitioning}
            >
              {t("common.moodly")}
            </h1>
            {transitioning && (
              <div
                key={animKey}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                style={{ filter: 'url(#gooey-header)' }}
              >
                {puddleCircles.map((c) => (
                  <div
                    key={c.id}
                    className="absolute rounded-full bg-primary/45"
                    style={{
                      width: c.size,
                      height: c.size,
                      top: `calc(50% - ${c.size / 2}px)`,
                      left: `calc(50% - ${c.size / 2}px)`,
                      animation: `puddle-drop 1.4s ease-out ${c.delay}s forwards`,
                      '--tx': `${c.tx}px`,
                      '--ty': `${c.ty}px`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs md:hidden">
              {ALL_NAV_ITEMS.slice(0, 5).map((item) => (
                <button
                  key={item.path}
                  aria-label={t(item.labelKey)}
                  onClick={() => navigate(item.path)}
                  className={`p-1.5 rounded-lg hover:bg-secondary/50 transition-all duration-150 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    (item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </button>
              ))}
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

        <main id="main-content" className="flex-1 px-4 pb-8 space-y-4">
          {children}
        </main>

        <CrisisDialog
          open={crisisOpen}
          severity="urgent"
          onDismiss={() => setCrisisOpen(false)}
        />
        <button
          onClick={() => setCrisisOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-accent text-white shadow-neumorphic flex items-center justify-center cursor-pointer hover:opacity-90 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("crisis.floatingButton")}
        >
          <PhoneCall className="w-5 h-5" />
        </button>
      </div>

      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="gooey-header">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
