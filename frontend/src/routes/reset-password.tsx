import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/error-messages";
import { rewrapDataKeyWithRecovery, createFreshDataKey } from "../lib/crypto/auth-keys";
import { Button } from "../components/ui/button";
import { PasswordInput } from "../components/ui/password-input";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [dataLossAccepted, setDataLossAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t("resetPassword.mismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("resetPassword.tooShort"));
      return;
    }
    if (!recoveryCode.trim() && !dataLossAccepted) {
      setError(t("resetPassword.recoveryRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      let wrappedKey: string;
      let keySalt: string;
      if (recoveryCode.trim()) {
        // Сервер возвращает recoveryWrappedKey/recoverySalt через login-эндпоинт
        // недоступен (пароль забыт), поэтому fetch recovery-материала отдельно.
        const info = await api.auth.recoveryInfo({ token });
        if (!info.recoveryWrappedKey || !info.recoverySalt) {
          throw new Error(t("resetPassword.noRecoveryStored"));
        }
        const rewrapped = await rewrapDataKeyWithRecovery(
          recoveryCode.trim(),
          info.recoveryWrappedKey,
          info.recoverySalt,
          password,
        );
        wrappedKey = rewrapped.wrappedKey;
        keySalt = rewrapped.keySalt;
      } else {
        // Без recovery-кода — новый ключ, старые данные не расшифровываются.
        const fresh = await createFreshDataKey(password);
        wrappedKey = fresh.wrappedKey;
        keySalt = fresh.keySalt;
      }
      const res = await api.auth.resetPassword({ token, password, wrappedKey, keySalt });
      login(res.accessToken);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4 text-center">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              {t("resetPassword.invalidLink")}
            </h2>
            <Button variant="secondary" className="w-full" asChild>
              <Link to="/login">{t("forgotPassword.backToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-serif font-semibold text-center text-foreground">
            {t("resetPassword.title")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("resetPassword.newPassword")}</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                enterKeyHint="next"
                required
                minLength={6}
                autoFocus
                showLabel={t("common.showPassword")}
                hideLabel={t("common.hidePassword")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("resetPassword.confirmPassword")}</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                enterKeyHint="next"
                required
                minLength={6}
                showLabel={t("common.showPassword")}
                hideLabel={t("common.hidePassword")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recoveryCode">{t("resetPassword.recoveryCode")}</Label>
              <Input
                id="recoveryCode"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                autoComplete="off"
                enterKeyHint="go"
                placeholder={t("resetPassword.recoveryPlaceholder")}
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">{t("resetPassword.recoveryHint")}</p>
            </div>
            {!recoveryCode.trim() && (
              <Label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={dataLossAccepted}
                  onChange={(e) => setDataLossAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span>{t("resetPassword.dataLossWarning")}</span>
              </Label>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("resetPassword.resetting") : t("resetPassword.reset")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
