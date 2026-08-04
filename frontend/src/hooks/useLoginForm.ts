import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/error-messages";

const DEMO_MODE = import.meta.env.DEV;

export function useLoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.auth.login({ email, password });
      login(res.accessToken);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, t));
    }
  };

  const handleDemo = useCallback(async () => {
    if (!import.meta.env.DEV) return;
    setDemoLoading(true);
    setError("");
    try {
      const res = await api.auth.login({ email: "demo@moodly.app", password: "demo123" });
      login(res.accessToken);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, t));
    } finally {
      setDemoLoading(false);
    }
  }, [login, navigate, t]);

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
