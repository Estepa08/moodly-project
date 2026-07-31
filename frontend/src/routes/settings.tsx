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
import { Bell, Shield, Trash2, AlertTriangle, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
            <Bell aria-hidden="true" className="w-4 h-4" />
            {t("settings.notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("settings.comingSoon")}</p>
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
