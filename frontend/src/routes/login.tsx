import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { useLoginForm } from "../hooks/useLoginForm";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PasswordInput } from "../components/ui/password-input";
import { Label } from "../components/ui/label";
import { MailCheck } from "lucide-react";
import { AuthPage, AuthHeader, AuthDisclaimer } from "../features/auth";

export default function LoginPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    demoMode,
    demoLoading,
    handleSubmit,
    handleDemo,
  } = useLoginForm();

  const verified = searchParams.get("verified") === "true";

  if (verified) {
    return (
      <AuthPage>
        <div className="space-y-5 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <MailCheck aria-hidden="true" className="w-6 h-6 text-success" />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-semibold">{t("register.emailVerifiedTitle")}</h2>
          <p className="text-muted-foreground">{t("register.emailVerifiedMessage")}</p>
          <Button className="w-full" asChild>
            <Link to="/login">{t("login.signIn")}</Link>
          </Button>
        </div>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthHeader title={t("login.title")} subtitle={t("login.tagline")} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("login.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            required
            autoFocus={!isMobile}
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="go"
            required
            showLabel={t("common.showPassword")}
            hideLabel={t("common.hidePassword")}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full">
          {t("login.signIn")}
        </Button>

        {demoMode && (
          <>
            <div className="flex items-center gap-2">
              <span className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{t("login.or")}</span>
              <span className="flex-1 h-px bg-border" />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={demoLoading}
              onClick={handleDemo}
            >
              {demoLoading ? t("login.starting") : t("login.quickDemo")}
            </Button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            {t("login.signUp")}
          </Link>
        </p>
      </form>

      <AuthDisclaimer />
    </AuthPage>
  );
}
