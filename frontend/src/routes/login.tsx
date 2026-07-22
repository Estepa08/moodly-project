import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const reducedMotion = useReducedMotion();

  const [isLogin, setIsLogin] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");

  const [demoLoading, setDemoLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await api.auth.login({ email: loginEmail, password: loginPassword });
      login(res.accessToken);
      navigate("/");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : t("login.loginFailed"));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    try {
      const res = await api.auth.register({ email: regEmail, password: regPassword, name: regName || undefined });
      login(res.accessToken);
      navigate("/onboarding");
    } catch (err) {
      setRegError(err instanceof Error ? err.message : t("register.registrationFailed"));
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setLoginError("");
    try {
      const res = await api.auth.demo();
      login(res.accessToken);
      navigate("/");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : t("login.demoFailed"));
    } finally {
      setDemoLoading(false);
    }
  };

  const toggle = useCallback(() => {
    setIsLogin((prev) => !prev);
  }, []);

  const staggerEnter = (index: number) => {
    if (reducedMotion) return undefined;
    return { transitionDelay: `${50 + index * 60}ms` };
  };

  const staggerExit = (index: number) => {
    if (reducedMotion) return undefined;
    return { transitionDelay: `${(6 - index) * 50}ms` };
  };

  const a = (i: number, entering: boolean) => {
    if (reducedMotion) return {};
    const base = "transition-all duration-300";
    return {
      className: entering ? `${base} opacity-100 translate-x-0` : `${base} opacity-0 translate-x-4`,
      style: entering ? staggerEnter(i) : staggerExit(i),
    };
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1 text-xs">
        <button
          className={cn(
            "px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            i18n.language === "en" ? "text-primary font-semibold" : "text-muted-foreground",
          )}
          onClick={() => i18n.changeLanguage("en")}
        >
          {t("common.languageEn")}
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          className={cn(
            "px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            i18n.language === "ru" ? "text-primary font-semibold" : "text-muted-foreground",
          )}
          onClick={() => i18n.changeLanguage("ru")}
        >
          {t("common.languageRu")}
        </button>
      </div>

      <Card className="w-full max-w-sm overflow-hidden">
        <CardContent className="p-0">
          <div
            className={cn(reducedMotion ? "" : "flex transition-transform duration-300 ease-in-out")}
            style={{ transform: reducedMotion || isLogin ? "translateX(0)" : "translateX(-100%)" }}
          >
            {/* Login panel */}
            <div className="w-full flex-shrink-0 p-6 space-y-4">
              <div {...a(0, isLogin)}>
                <h2 className="text-2xl text-foreground text-center font-serif">{t("login.title")}</h2>
                <p className="text-sm text-muted-foreground text-center">{t("login.subtitle")}</p>
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2" {...a(1, isLogin)}>
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <Input id="email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2" {...a(2, isLogin)}>
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Input id="password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                {loginError && <p className="text-sm text-destructive" {...a(3, isLogin)}>{loginError}</p>}
                <Button type="submit" className="w-full" {...a(3, isLogin)}>
                  {t("login.signIn")}
                </Button>
                <div className="flex items-center gap-2" {...a(4, isLogin)}>
                  <span className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{t("login.or")}</span>
                  <span className="flex-1 h-px bg-border" />
                </div>
                <Button type="button" variant="secondary" className="w-full" onClick={handleDemo} disabled={demoLoading} {...a(5, isLogin)}>
                  {demoLoading ? t("login.starting") : t("login.quickDemo")}
                </Button>
                <p className="text-center text-sm text-muted-foreground" {...a(6, isLogin)}>
                  {t("login.noAccount")}{" "}
                  <button type="button" className="text-primary hover:underline cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={toggle}>
                    {t("login.signUp")}
                  </button>
                </p>
              </form>
            </div>

            {/* Register panel */}
            <div className="w-full flex-shrink-0 p-6 space-y-4">
              <div {...a(0, !isLogin)}>
                <h2 className="text-2xl text-foreground text-center font-serif">{t("register.title")}</h2>
                <p className="text-sm text-muted-foreground text-center">{t("register.subtitle")}</p>
              </div>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2" {...a(1, !isLogin)}>
                  <Label htmlFor="regName">{t("register.name")}</Label>
                  <Input id="regName" value={regName} onChange={(e) => setRegName(e.target.value)} />
                </div>
                <div className="space-y-2" {...a(2, !isLogin)}>
                  <Label htmlFor="regEmail">{t("register.email")}</Label>
                  <Input id="regEmail" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>
                <div className="space-y-2" {...a(3, !isLogin)}>
                  <Label htmlFor="regPassword">{t("register.password")}</Label>
                  <Input id="regPassword" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                </div>
                {regError && <p className="text-sm text-destructive" {...a(4, !isLogin)}>{regError}</p>}
                <Button type="submit" className="w-full" {...a(4, !isLogin)}>
                  {t("register.signUp")}
                </Button>
                <p className="text-center text-sm text-muted-foreground" {...a(5, !isLogin)}>
                  {t("register.hasAccount")}{" "}
                  <button type="button" className="text-primary hover:underline cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={toggle}>
                    {t("register.signIn")}
                  </button>
                </p>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
