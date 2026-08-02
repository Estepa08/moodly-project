import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Globe,
  Bell,
  Shield,
  Star,
  Trash2,
  AlertTriangle,
  ChevronRight,
  PawPrint,
} from "lucide-react";
import { cn } from "../lib/utils";
import ReviewForm from "../features/review/ReviewForm";
import {
  isCompanionHidden,
  setCompanionHidden,
} from "../features/gamification/companionVisibility";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [companionHidden, setCompanionHiddenState] = useState(isCompanionHidden());

  const toggleCompanion = () => {
    const next = !companionHidden;
    setCompanionHiddenState(next);
    setCompanionHidden(next);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.users.delete();
      logout();
      navigate("/login");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("settings.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-20">
      <h1 className="text-xl font-bold text-foreground font-serif">{t("settings.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield aria-hidden="true" className="w-4 h-4" />
            {t("settings.account")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{t("settings.email")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.comingSoon")}</p>
            </div>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{t("settings.password")}</p>
              <p className="text-xs text-muted-foreground">{t("settings.comingSoon")}</p>
            </div>
            <ChevronRight aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe aria-hidden="true" className="w-4 h-4" />
            {t("settings.language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex items-stretch rounded-full bg-muted p-1 shadow-neumorphic-inset">
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary-strong shadow-neumorphic-sm transition-transform duration-200 motion-reduce:transition-none",
                i18n.language === "en" && "translate-x-full",
              )}
            />
            {(["ru", "en"] as const).map((lang) => {
              const active = i18n.language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={active}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={cn(
                    "relative z-10 flex-1 min-h-[44px] rounded-full text-sm font-medium text-center transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]",
                    active ? "text-primary-foreground" : "text-muted-foreground hover:text-primary",
                  )}
                >
                  {lang === "ru" ? "Русский" : "English"}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell aria-hidden="true" className="w-4 h-4" />
            {t("settings.notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("settings.comingSoon")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PawPrint aria-hidden="true" className="w-4 h-4" />
            {t("settings.companionSection")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("settings.companionToggleLabel")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.companionToggleDesc")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!companionHidden}
              aria-label={t("settings.companionToggleLabel")}
              onClick={toggleCompanion}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors duration-200 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !companionHidden ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 h-5 w-5 rounded-full bg-background shadow-neumorphic-sm transition-transform duration-200",
                  !companionHidden && "translate-x-5",
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star aria-hidden="true" className="w-4 h-4" />
            {t("review.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 aria-hidden="true" className="w-4 h-4" />
            {t("settings.deleteAccount")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("settings.deleteDesc")}</p>
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          )}
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            {t("settings.deleteButton")}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(v) => {
          if (!v) setShowDeleteConfirm(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle aria-hidden="true" className="w-5 h-5 text-destructive" />
              <DialogTitle className="text-lg">{t("settings.confirmTitle")}</DialogTitle>
            </div>
            <DialogDescription className="text-sm">{t("settings.confirmDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              {t("settings.confirmCancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("settings.deleting") : t("settings.confirmDelete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
