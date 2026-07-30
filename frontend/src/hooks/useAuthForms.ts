import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { api } from "../lib/api";
import { ApiError } from "../lib/api-error";

const DEMO_MODE = import.meta.env.DEV;

const ERROR_I18N_KEYS: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "auth.emailNotVerified",
  INVALID_CREDENTIALS: "errors.invalidCredentials",
  CONFLICT: "errors.conflict",
  CONSENT_REQUIRED: "errors.consentRequired",
  VALIDATION_ERROR: "errors.validationError",
  INVALID_RESET_TOKEN: "errors.invalidResetToken",
};

function getErrorMessage(err: unknown, fallbackKey: string, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    const i18nKey = ERROR_I18N_KEYS[err.code];
    if (i18nKey) return t(i18nKey);
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return t(fallbackKey);
}

export function useAuthForms() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regAgeConfirmed, setRegAgeConfirmed] = useState(false);

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const verified = searchParams.get("verified") === "true";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await api.auth.login({ email: loginEmail, password: loginPassword });
      login(res.accessToken);
      navigate("/");
    } catch (err) {
      setLoginError(getErrorMessage(err, "login.loginFailed", t));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    try {
      await api.auth.register({
        email: regEmail,
        password: regPassword,
        name: regName || undefined,
        ageConfirmed: regAgeConfirmed,
      });
      setRegisteredEmail(regEmail);
    } catch (err) {
      setRegError(getErrorMessage(err, "register.registrationFailed", t));
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    try {
      await api.auth.sendVerificationEmail(registeredEmail);
    } catch {
      // silent
    }
  };

  const handleDemo = useCallback(async () => {
    if (!import.meta.env.DEV) return;
    setDemoLoading(true);
    setLoginError("");
    try {
      const res = await api.auth.login({ email: "demo@moodly.app", password: "demo123" });
      login(res.accessToken);
      navigate("/");
    } catch (err) {
      setLoginError(getErrorMessage(err, "login.demoFailed", t));
    } finally {
      setDemoLoading(false);
    }
  }, [login, navigate, t]);

  return {
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
    setRegisteredEmail,
    verified,
    demoMode: DEMO_MODE,
    demoLoading,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleResendVerification,
    handleDemo,
  };
}
