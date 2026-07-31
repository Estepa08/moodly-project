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
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.auth.register({
        email,
        password,
        ageConfirmed,
      });
      login(res.accessToken);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, t));
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    ageConfirmed,
    setAgeConfirmed,
    error,
    handleSubmit,
  };
}
