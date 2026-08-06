import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import ContentMessagesManager from "../features/content/ContentMessagesManager";
import { useCurrentUser } from "../hooks/useCurrentUser";
import EmptyState from "../components/ui/empty-state";

export default function ContentPage() {
  const { t } = useTranslation();
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentUser && currentUser.role !== "admin" && currentUser.role !== "content_manager") {
    return (
      <EmptyState icon={MessageCircle} title={t("content.forbidden")} className="min-h-[50vh]" />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20">
      <div>
        <h1 className="text-xl font-bold text-foreground font-serif">{t("content.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("content.subtitle")}</p>
      </div>
      <ContentMessagesManager />
    </div>
  );
}
