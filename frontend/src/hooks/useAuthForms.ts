import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { api } from "../lib/api";
import { DISCLAIMER_ACCEPTED_KEY } from "../lib/constants";

export function useAuthForms() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConsent, setRegConsent] = useState(false);
  const [regError, setRegError] = useState("");

  const [demoLoading, setDemoLoading] = useState(false);

  const acceptDisclaimer = () => localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    acceptDisclaimer();
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
    if (!regConsent) {
      setRegError(t("register.consentRequired"));
      return;
    }
    setRegError("");
    try {
      const res = await api.auth.register({
        email: regEmail,
        password: regPassword,
        name: regName || undefined,
        ageConfirmed: true,
      });
      acceptDisclaimer();
      login(res.accessToken);
      navigate("/onboarding");
    } catch (err) {
      setRegError(err instanceof Error ? err.message : t("register.registrationFailed"));
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setLoginError("");
    acceptDisclaimer();
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
    regConsent,
    setRegConsent,
    regError,
    demoLoading,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleDemo,
  };
}
