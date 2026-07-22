import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";
import { Heart, Info, ChevronDown, PhoneCall } from "lucide-react";

const STORAGE_KEY = "moodly_disclaimer_accepted";

interface Props {
  defaultRegister?: boolean;
}

export default function LoginPage({ defaultRegister }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const reducedMotion = useReducedMotion();

  const [isLogin, setIsLogin] = useState(() => !defaultRegister);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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
    localStorage.setItem(STORAGE_KEY, "true");
    setLoginError("");
    try {
      const res = await api.auth.login({ email: loginEmail, password: loginPassword });
      login(res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      navigate("/");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : t("login.loginFailed"));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, "true");
    setRegError("");
    try {
      const res = await api.auth.register({ email: regEmail, password: regPassword, name: regName || undefined });
      login(res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
      navigate("/onboarding");
    } catch (err) {
      setRegError(err instanceof Error ? err.message : t("register.registrationFailed"));
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setLoginError("");
    localStorage.setItem(STORAGE_KEY, "true");
    try {
      const res = await api.auth.demo();
      login(res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
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

  const isRu = i18n.language === "ru";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1 text-xs z-10">
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

      <div className="w-full max-w-sm">
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* ── Warm welcome ── */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-serif font-semibold text-foreground">{t("login.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("login.welcomeMessage")}</p>
            </div>

            {/* ── Crisis helpline ── */}
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-accent">{t("crisis.helpline")}</span>
              </div>
              {isRu ? (
                <div className="flex gap-2 text-xs font-bold">
                  <a href="tel:88002000122" className="text-foreground hover:text-accent transition-colors">8-800-200-01-22</a>
                  <a href="tel:112" className="text-foreground hover:text-accent transition-colors">112</a>
                </div>
              ) : (
                <a href="tel:988" className="text-xs font-bold text-foreground hover:text-accent transition-colors">988</a>
              )}
            </div>

            {/* ── Auth form ── */}
            <div
              className={cn(reducedMotion ? "" : "flex transition-transform duration-300 ease-in-out")}
              style={{ transform: reducedMotion || isLogin ? "translateX(0)" : "translateX(-100%)" }}
            >
              {/* Login panel */}
              <div className="w-full flex-shrink-0 space-y-4">
                <div {...a(0, isLogin)}>
                  <h3 className="text-center text-foreground font-serif">{t("login.subtitle")}</h3>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2" {...a(1, isLogin)}>
                    <Label htmlFor="email">{t("login.email")}</Label>
                    <Input id="email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2" {...a(2, isLogin)}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t("login.password")}</Label>
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-xs text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {t("login.forgotPassword")}
                      </button>
                    </div>
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
              <div className="w-full flex-shrink-0 space-y-4">
                <div {...a(0, !isLogin)}>
                  <h3 className="text-center text-foreground font-serif">{t("register.title")}</h3>
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

            {/* ── Collapsible disclaimer ── */}
            <div className="border-t border-border pt-3">
              <button
                onClick={() => setShowDisclaimer(!showDisclaimer)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{t("login.disclaimerTitle")}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDisclaimer ? "rotate-180" : ""}`} />
              </button>
              {showDisclaimer && (
                <div className="mt-2 space-y-2 text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1">
                  <p>{t("login.disclaimer")}</p>
                  <p>{t("login.privacyNotice")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
