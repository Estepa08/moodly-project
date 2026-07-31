import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MailCheck, Loader2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    api.auth
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/login?verified=true", { replace: true }), 1500);
      })
      .catch(() => setStatus("error"));
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card>
        <CardContent className="p-6 space-y-5 text-center max-w-md">
          {status === "loading" && (
            <>
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">{t("register.verifyingEmail")}</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <MailCheck className="w-6 h-6 text-success" />
                </div>
              </div>
              <h2 className="text-xl font-semibold">{t("register.emailVerifiedTitle")}</h2>
              <p className="text-muted-foreground">{t("register.emailVerifiedMessage")}</p>
            </>
          )}
          {status === "error" && (
            <>
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <h2 className="text-xl font-semibold">{t("register.verificationFailed")}</h2>
              <p className="text-muted-foreground">{t("register.verificationFailedMessage")}</p>
              <Button asChild variant="outline">
                <Link to="/login">{t("register.backToLogin")}</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
