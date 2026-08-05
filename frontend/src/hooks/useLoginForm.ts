import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/error-messages";
import { unlockDataKeyFromLogin } from "../lib/crypto/auth-keys";
import { setSessionUserId } from "../lib/crypto/session";

const DEMO_MODE = import.meta.env.DEV;

export function useLoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  async function authenticate(loginPassword: string, loginEmail: string): Promise<boolean> {
    const res = await api.auth.login({ email: loginEmail, password: loginPassword });
    if (res.wrappedKey && res.keySalt) {
      await unlockDataKeyFromLogin(loginPassword, res.wrappedKey, res.keySalt);
      setSessionUserId(res.user.id);
    } else {
      // Аккаунты без E2E-ключей (старые) — работаем без локального шифрования.
      setError(t("login.legacyAccount"));
      return false;
    }
    login(res.accessToken);
    navigate("/dashboard");
    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authenticate(password, email);
    } catch (err) {
      setError(getErrorMessage(err, t));
    }
  };

  const handleDemo = async () => {
    if (!import.meta.env.DEV) return;
    setDemoLoading(true);
    setError("");
    try {
      await authenticate("demo123", "demo@moodly.app");
    } catch (err) {
      setError(getErrorMessage(err, t));
    } finally {
      setDemoLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    demoMode: DEMO_MODE,
    demoLoading,
    handleSubmit,
    handleDemo,
  };
}
