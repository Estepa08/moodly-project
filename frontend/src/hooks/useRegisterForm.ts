import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/error-messages";
import { useAuth } from "./useAuth";

export function useRegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pdpConsent, setPdpConsent] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const birthYearNum = birthYear ? Number(birthYear) : null;
  const isAdult = birthYearNum != null && currentYear - birthYearNum >= 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isAdult) {
      setError(t("register.ageError"));
      return;
    }
    try {
      const res = await api.auth.register({
        email,
        password,
        ageConfirmed,
        pdpConsent,
        birthYear: birthYearNum ?? undefined,
      });
      login(res.accessToken);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, t));
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    birthYear,
    setBirthYear,
    ageConfirmed,
    setAgeConfirmed,
    pdpConsent,
    setPdpConsent,
    error,
    handleSubmit,
    isAdult,
  };
}
