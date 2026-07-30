import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsMobile } from "../hooks/useIsMobile";
import { useAuthForms } from "../hooks/useAuthForms";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PasswordInput } from "../components/ui/password-input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";
import { Heart, Info, ChevronDown, MailCheck } from "lucide-react";

interface Props {
  defaultRegister?: boolean;
}

export default function LoginPage({ defaultRegister }: Props) {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const [isLogin, setIsLogin] = useState(() => !defaultRegister);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const {
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginError,
    regName,
    setRegName,
    regEmail,
    setRegEmail,
    regPassword,
    setRegPassword,
    regAgeConfirmed,
    setRegAgeConfirmed,
    regError,
    registeredEmail,
    verified,
    setRegisteredEmail,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleResendVerification,
    devVerificationLink,
    handleDemo,
    demoMode,
  } = useAuthForms();

  const toggle = useCallback(() => {
    setIsLogin((prev) => !prev);
  }, []);

  const staggerEnter = (index: number) => {
    if (reducedMotion) return undefined;
    return { transitionDelay: `${50 + index * 60}ms` };
  };

  const a = (i: number, entering: boolean) => {
    if (reducedMotion) return {};
    const base = "transition-[opacity,transform] duration-300";
    return {
      className: entering ? `${base} ease-out opacity-100 translate-x-0` : `${base} ease-out opacity-0 translate-x-4`,
      style: entering ? staggerEnter(i) : undefined,
    };
  };

  if (registeredEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 space-y-5 text-center max-w-md">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MailCheck aria-hidden="true" className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-serif font-semibold">{t("register.checkEmailTitle")}</h2>
            <p className="text-muted-foreground">{t("register.checkEmailMessage", { email: registeredEmail })}</p>
            {devVerificationLink && (
              <p>
                <a href={devVerificationLink} className="text-primary hover:underline text-sm">
                  {t("register.devVerifyLink")}
                </a>
              </p>
            )}
            <Button variant="outline" onClick={handleResendVerification}>
              {t("register.resendEmail")}
            </Button>
            <p className="text-sm text-muted-foreground">
              <button
                type="button"
                className="text-primary hover:underline cursor-pointer"
                onClick={() => { setRegisteredEmail(null); setIsLogin(true); }}
              >
                {t("register.backToLogin")}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 space-y-5 text-center max-w-md">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <MailCheck aria-hidden="true" className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-serif font-semibold">{t("register.emailVerifiedTitle")}</h2>
            <p className="text-muted-foreground">{t("register.emailVerifiedMessage")}</p>
            <Button onClick={() => setIsLogin(true)}>{t("login.signIn")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs z-10">
        <button
          className={cn(
            "px-1.5 py-0.5 rounded cursor-pointer transition-[color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            i18n.language === "en" ? "text-primary font-semibold" : "text-muted-foreground",
          )}
          onClick={() => i18n.changeLanguage("en")}
        >
          {t("common.languageEn")}
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          className={cn(
            "px-1.5 py-0.5 rounded cursor-pointer transition-[color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            i18n.language === "ru" ? "text-primary font-semibold" : "text-muted-foreground",
          )}
          onClick={() => i18n.changeLanguage("ru")}
        >
          {t("common.languageRu")}
        </button>
      </div>

      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart aria-hidden="true" className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-serif font-semibold text-foreground">
                {t("login.title")}
              </h2>
              <p className="text-base font-medium text-foreground">{t("login.tagline")}</p>
              <p className="text-base text-muted-foreground">{t("login.welcomeMessage")}</p>
              <p className="text-xs text-muted-foreground">{t("login.privacyNotice")}</p>
            </div>

          <div
            className={cn(
              reducedMotion ? "" : "flex transition-transform duration-300 ease-out",
            )}
              style={{
                transform: reducedMotion || isLogin ? "translateX(0)" : "translateX(-100%)",
              }}
            >
              <div className="w-full flex-shrink-0 space-y-4">
                <div {...a(0, isLogin)}>
                  <h3 className="text-center text-foreground font-serif">{t("login.subtitle")}</h3>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2" {...a(1, isLogin)}>
                    <Label htmlFor="email">{t("login.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      enterKeyHint="next"
                      required
                      autoFocus={!isMobile}
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-2" {...a(2, isLogin)}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t("login.password")}</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {t("login.forgotPassword")}
                      </Link>
                    </div>
                    <PasswordInput
                      id="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      enterKeyHint="go"
                      required
                      showLabel={t("common.showPassword")}
                      hideLabel={t("common.hidePassword")}
                    />
                  </div>
                  {loginError && (
                    <p className="text-sm text-destructive" role="alert" {...a(3, isLogin)}>
                      {loginError}
                    </p>
                  )}
                  <Button type="submit" className="w-full" {...a(3, isLogin)}>
                    {t("login.signIn")}
                  </Button>
                  <div className="flex items-center gap-2" {...a(4, isLogin)}>
                    <span className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{t("login.or")}</span>
                    <span className="flex-1 h-px bg-border" />
                  </div>

                  {demoMode && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={handleDemo}
                        {...a(5, isLogin)}
                      >
                        {t("login.quickDemo")}
                      </Button>
                      <div className="flex items-center gap-2" {...a(5, isLogin)}>
                        <span className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">{t("login.or")}</span>
                        <span className="flex-1 h-px bg-border" />
                      </div>
                    </>
                  )}

                  <p className="text-center text-sm text-muted-foreground" {...a(6, isLogin)}>
                    {t("login.noAccount")}{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline cursor-pointer transition-[text-decoration,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={toggle}
                    >
                      {t("login.signUp")}
                    </button>
                  </p>
                </form>
              </div>

              <div className="w-full flex-shrink-0 space-y-4">
                <div {...a(0, !isLogin)}>
                  <h3 className="text-center text-foreground font-serif">{t("register.title")}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("register.subtitle")}
                  </p>
                </div>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2" {...a(1, !isLogin)}>
                    <Label htmlFor="regName">{t("register.name")}</Label>
                    <Input
                      id="regName"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      autoComplete="name"
                      enterKeyHint="next"
                      autoFocus={!isMobile}
                    />
                  </div>
                  <div className="space-y-2" {...a(2, !isLogin)}>
                    <Label htmlFor="regEmail">{t("register.email")}</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      enterKeyHint="next"
                      required
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-2" {...a(3, !isLogin)}>
                    <Label htmlFor="regPassword">{t("register.password")}</Label>
                    <PasswordInput
                      id="regPassword"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                      enterKeyHint="go"
                      required
                      showLabel={t("common.showPassword")}
                      hideLabel={t("common.hidePassword")}
                    />
                  </div>
                  <div className="space-y-2" {...a(4, !isLogin)}>
                    <Label className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regAgeConfirmed}
                        onChange={(e) => setRegAgeConfirmed(e.target.checked)}
                        className="mt-1"
                        required
                      />
                      <span>
                        {t("register.consentText")}{" "}
                        <Link to="/terms" className="text-primary hover:underline">{t("register.termsLink")}</Link>
                        {" "}{t("register.and")}{" "}
                        <Link to="/privacy" className="text-primary hover:underline">{t("register.privacyLink")}</Link>
                      </span>
                    </Label>
                  </div>
                  {regError && (
                    <p className="text-sm text-destructive" role="alert" {...a(5, !isLogin)}>
                      {regError}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={!regAgeConfirmed} {...a(5, !isLogin)}>
                    {t("register.signUp")}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground" {...a(5, !isLogin)}>
                    {t("register.hasAccount")}{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline cursor-pointer transition-[text-decoration,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={toggle}
                    >
                      {t("register.signIn")}
                    </button>
                  </p>
                </form>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <button
                onClick={() => setShowDisclaimer(!showDisclaimer)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info aria-hidden="true" className="w-3.5 h-3.5" />
                <span>{t("login.disclaimerTitle")}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showDisclaimer ? "rotate-180" : ""}`}
                />
              </button>
              {showDisclaimer && (
                <div className="mt-2 space-y-2 text-xs text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-top-1">
                  <p>{t("login.disclaimer")}</p>
                  <div className="flex gap-3 pt-1">
                    <Link to="/privacy" className="text-primary hover:underline">{t("login.privacyPolicy")}</Link>
                    <Link to="/terms" className="text-primary hover:underline">{t("login.termsOfService")}</Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
