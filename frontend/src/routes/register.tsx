import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.auth.register({ email, password, name: name || undefined });
      login(res.accessToken);
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("register.registrationFailed"));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1 text-xs">
        <button
          className={`px-1.5 py-0.5 rounded cursor-pointer ${i18n.language === "en" ? "text-primary font-semibold" : "text-muted-foreground"}`}
          onClick={() => i18n.changeLanguage("en")}
        >
          {t("common.languageEn")}
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          className={`px-1.5 py-0.5 rounded cursor-pointer ${i18n.language === "ru" ? "text-primary font-semibold" : "text-muted-foreground"}`}
          onClick={() => i18n.changeLanguage("ru")}
        >
          {t("common.languageRu")}
        </button>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">{t("register.title")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{t("register.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("register.name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("register.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full">{t("register.signUp")}</Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("register.hasAccount")}{" "}
              <button type="button" className="text-primary hover:underline cursor-pointer" onClick={() => navigate("/login")}>
                {t("register.signIn")}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
