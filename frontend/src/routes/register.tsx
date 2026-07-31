import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PasswordInput } from "../components/ui/password-input";
import { Label } from "../components/ui/label";
import { AuthPage, AuthHeader, AuthDisclaimer } from "../features/auth";

export default function RegisterPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    ageConfirmed,
    setAgeConfirmed,
    error,
    handleSubmit,
  } = useRegisterForm();

  return (
    <AuthPage>
      <AuthHeader title={t("register.title")} subtitle={t("register.subtitle")} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="regName">{t("register.name")}</Label>
          <Input
            id="regName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            enterKeyHint="next"
            autoFocus={!isMobile}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="regEmail">{t("register.email")}</Label>
          <Input
            id="regEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            required
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="regPassword">{t("register.password")}</Label>
          <PasswordInput
            id="regPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            enterKeyHint="go"
            required
            showLabel={t("common.showPassword")}
            hideLabel={t("common.hidePassword")}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              {t("register.consentText")}{" "}
              <Link to="/terms" className="text-primary hover:underline">
                {t("register.termsLink")}
              </Link>{" "}
              {t("register.and")}{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                {t("register.privacyLink")}
              </Link>
            </span>
          </Label>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={!ageConfirmed}>
          {t("register.signUp")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            {t("register.signIn")}
          </Link>
        </p>
      </form>

      <AuthDisclaimer />
    </AuthPage>
  );
}
