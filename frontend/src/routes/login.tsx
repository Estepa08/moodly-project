import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { useLoginForm } from "../hooks/useLoginForm";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PasswordInput } from "../components/ui/password-input";
import { Label } from "../components/ui/label";
import { AuthPage, AuthHeader, AuthDisclaimer } from "../features/auth";

export default function LoginPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

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
