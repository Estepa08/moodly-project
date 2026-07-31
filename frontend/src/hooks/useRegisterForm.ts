import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { getErrorMessage } from "../lib/error-messages";

export function useRegisterForm() {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [devVerificationLink, setDevVerificationLink] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.auth.register({
        email,
        password,
        name: name || undefined,
        ageConfirmed,
      });
      setRegisteredEmail(email);
      setDevVerificationLink(res.devVerificationLink);
    } catch (err) {
      setError(getErrorMessage(err, t));
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

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    ageConfirmed,
    setAgeConfirmed,
    error,
    registeredEmail,
    setRegisteredEmail,
    devVerificationLink,
    handleSubmit,
    handleResendVerification,
  };
}
