import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type AdminUser } from "../lib/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import Spinner from "../components/ui/spinner";
import EmptyState from "../components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { AlertTriangle, ShieldCheck, Users } from "lucide-react";
import { cn } from "../lib/utils";

function initials(u: AdminUser): string {
  if (u.name) {
    const parts = u.name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase();
  }
  return u.email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-warning/10 text-warning",
  "bg-success/10 text-success",
  "bg-destructive/10 text-destructive",
  "bg-info/10 text-info",
];

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminPanelPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const usersQuery = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => api.admin.listUsers(),
  });

  const [target, setTarget] = useState<AdminUser | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (currentUser && currentUser.role !== "admin") {
    return <EmptyState icon={ShieldCheck} title={t("admin.forbidden")} className="min-h-[50vh]" />;
  }

  const users = usersQuery.data ?? [];
  const matches = target !== null && confirmEmail.trim().toLowerCase() === target.email.toLowerCase();

  const openDelete = (user: AdminUser) => {
    setTarget(user);
    setConfirmEmail("");
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!target) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.admin.deleteUser(target.id);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setTarget(null);
      setConfirmEmail("");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("admin.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground font-serif">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
        {!usersQuery.isLoading && (
          <span className="px-3 py-1.5 rounded-lg bg-secondary/50 text-sm text-muted-foreground shadow-neumorphic-sm">
            {t("admin.total")}: {users.length}
          </span>
        )}
      </div>

      {usersQuery.isLoading ? (
        <Card className="flex items-center justify-center py-16">
          <Spinner size={28} />
        </Card>
      ) : usersQuery.isError ? (
        <EmptyState icon={Users} title={t("admin.loadFailed")} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title={t("admin.empty")} />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("admin.deleteWarning")}</p>

          <Card className="overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium">{t("admin.user")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.role")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.registered")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.emailVerified")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.activity")}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                              AVATAR_COLORS[idx % AVATAR_COLORS.length],
                            )}
                          >
                            {initials(u)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {u.name ?? t("admin.roleUser")}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-md text-xs font-semibold",
                            u.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {u.role === "admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(u.createdAt, i18n.language)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.emailVerified ? t("admin.yes") : t("admin.no")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.entriesCount} {t("admin.entriesCount")} · {u.testResultsCount}{" "}
                        {t("admin.testsCount")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/5"
                          onClick={() => openDelete(u)}
                        >
                          {t("admin.delete")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border">
              {users.map((u, idx) => (
                <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                  <span
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                      AVATAR_COLORS[idx % AVATAR_COLORS.length],
                    )}
                  >
                    {initials(u)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{u.name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(u.createdAt, i18n.language)} · {u.entriesCount}{" "}
                      {t("admin.entriesCount")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0"
                    onClick={() => openDelete(u)}
                  >
                    {t("admin.delete")}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <Dialog
        open={target !== null}
        onOpenChange={(v) => {
          if (!v) setTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle aria-hidden="true" className="w-5 h-5 text-destructive" />
              <DialogTitle className="text-lg">{t("admin.deleteConfirmTitle")}</DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              {t("admin.deleteConfirmDesc", { email: target?.email })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">{t("admin.confirmEmailLabel")}</span>
              <Input
                type="email"
                autoComplete="off"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="mt-1"
              />
            </label>
            {deleteError && (
              <p className="text-sm text-destructive" role="alert">
                {deleteError}
              </p>
            )}
            {!matches && (
              <p className="text-xs text-muted-foreground">{t("admin.emailMismatch")}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTarget(null)}
                disabled={deleting}
              >
                {t("admin.cancel")}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!matches || deleting}
                onClick={handleDelete}
              >
                {deleting ? t("admin.deleting") : t("admin.deleteButton")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
