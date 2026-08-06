import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/error-messages";
import { useAuth } from "./useAuth";
import { createRegistrationKeys } from "../lib/crypto/auth-keys";
import { generateRecoveryCode } from "../lib/crypto/keys";
import { setSessionUserId } from "../lib/crypto/session";

export type RegisterStep = "form" | "recovery";

export function useRegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<RegisterStep>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pdpConsent, setPdpConsent] = useState(false);
  const [error, setError] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

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
      const code = generateRecoveryCode();
      const keys = await createRegistrationKeys(password, code);
      const res = await api.auth.register({
        email,
        password,
        ageConfirmed,
        pdpConsent,
        birthYear: birthYearNum ?? undefined,
        wrappedKey: keys.wrappedKey,
        keySalt: keys.keySalt,
        recoveryWrappedKey: keys.recoveryWrappedKey,
        recoverySalt: keys.recoverySalt,
      });
      login(res.accessToken);
      setSessionUserId(res.user.id);
      setRecoveryCode(code);
      setStep("recovery");
    } catch (err) {
      setError(getErrorMessage(err, t));
    }
  };

  const handleRecoveryConfirmed = () => {
    navigate("/my-day");
  };

  return {
    step,
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
    recoveryCode,
    handleRecoveryConfirmed,
    isAdult,
  };
}
