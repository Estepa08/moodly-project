import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.auth.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          {sent ? (
            <>
              <h2 className="text-xl font-serif font-semibold text-center text-foreground">{t("forgotPassword.checkEmail")}</h2>
              <p className="text-sm text-muted-foreground text-center">{t("forgotPassword.sent")}</p>
              <Button variant="secondary" className="w-full" onClick={() => navigate("/login")}>
                {t("forgotPassword.backToLogin")}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-serif font-semibold text-center text-foreground">{t("forgotPassword.title")}</h2>
              <p className="text-sm text-muted-foreground text-center">{t("forgotPassword.subtitle")}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("forgotPassword.email")}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("forgotPassword.sending") : t("forgotPassword.send")}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <button type="button" className="text-primary hover:underline cursor-pointer" onClick={() => navigate("/login")}>
                    {t("forgotPassword.backToLogin")}
                  </button>
                </p>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
