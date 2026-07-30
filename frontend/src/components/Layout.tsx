import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useCreatureState } from "../features/gamification";
import Lottie from "lottie-react";
import creatureAnimation from "../assets/lottie/breathing-creature.json";
import { SkipLink } from "../widgets";
import { StreakIndicator } from "../features/gamification";
import { CreatureStatus } from "../features/gamification";
import Sidebar from "../layout/Sidebar";
import LayoutModals from "../layout/LayoutModals";
import BottomNav from "../layout/BottomNav";
import Breadcrumbs from "../components/ui/breadcrumbs";
import { PRACTICE_ITEMS, OTHER_ITEMS, ALL_MORE_ITEMS } from "../layout/nav-config";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const isReducedMotion = useReducedMotion();
  const { data: creature } = useCreatureState();
  const [showCreature, setShowCreature] = useState(true);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
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

  useEffect(() => {
    if (isReducedMotion) return;
    const CYCLE_MS = 12000;
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
          <div className="flex-1 relative h-9 overflow-hidden">
            <div
              className={`absolute inset-0 flex items-center ${
                transitioning
                  ? prevWasCreature
                    ? "animate-creature-melt"
                    : "animate-creature-rise"
                  : showCreature
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={!showCreature && !transitioning}
            >
              <div
                className={`w-9 h-9 ${showCreature && !isReducedMotion && !transitioning ? "animate-header-drift" : ""}`}
              >
                <Lottie
                  animationData={creatureAnimation}
                  loop
                  autoplay={!isReducedMotion}
                  style={{ width: "100%", height: "100%" }}
                  role="img"
                  aria-label={t("common.moodly")}
                />
              </div>
            </div>
            <h1
              className={`absolute inset-0 flex items-center text-lg font-semibold text-primary font-serif text-balance ${
                transitioning
                  ? prevWasCreature
                    ? "animate-text-rise"
                    : "animate-text-melt"
                  : !showCreature
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={showCreature && !transitioning}
              translate="no"
            >
              {t("common.moodly")}
            </h1>
            {transitioning && (
              <div
                key={animKey}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                style={{ filter: "url(#gooey-header)" }}
              >
                {puddleCircles.map((c) => (
                  <div
                    key={c.id}
                    className="absolute rounded-full bg-primary/45"
                    style={
                      {
                        width: c.size,
                        height: c.size,
                        top: `calc(50% - ${c.size / 2}px)`,
                        left: `calc(50% - ${c.size / 2}px)`,
                        animation: `puddle-drop 1.4s ease-out ${c.delay}s forwards`,
                        "--tx": `${c.tx}px`,
                        "--ty": `${c.ty}px`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {creature && (
              <>
                <StreakIndicator streak={creature.streak} />
                <CreatureStatus level={creature.level} experience={creature.experience} />
              </>
            )}
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
              </div>
            </>
          )}
          <BottomNav onMoreOpen={() => setMobileMoreOpen((o) => !o)} isMoreActive={isMoreActive} />
        </div>

        <LayoutModals />
      </div>

      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="gooey-header">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
