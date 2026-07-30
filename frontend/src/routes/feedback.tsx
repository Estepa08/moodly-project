import { useTranslation } from "react-i18next";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useFeedbackList, useSubmitFeedback } from "../hooks/useFeedback";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import Spinner from "../components/ui/spinner";
import EmptyState from "../components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

export default function FeedbackPage() {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState("");
  const hasUnsaved = message.trim().length > 0;

  const { data: feedbacks, isLoading } = useFeedbackList();
  const submitFeedback = useSubmitFeedback();
  const blocker = useUnsavedChanges(hasUnsaved);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  const handleSubmit = () => {
    submitFeedback.mutate(message, {
      onSuccess: () => setMessage(""),
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground font-serif">{t("feedback.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("feedback.sendFeedback")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-message">{t("feedback.yourMessage")}</Label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("feedback.placeholder")}
              autoComplete="off"
              enterKeyHint="done"
              className="flex min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2 text-base shadow-neumorphic-inset placeholder:text-muted-foreground resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            />
          </div>
          <Button
            disabled={!message || submitFeedback.isPending}
            onClick={handleSubmit}
          >
            {submitFeedback.isPending ? t("common.sending") : t("feedback.send")}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={(v) => {
          if (!v && blocker.state === "blocked") blocker.reset();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("feedback.unsavedTitle")}</DialogTitle>
            <DialogDescription>{t("feedback.unsavedDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => blocker.reset?.()}>
              {t("feedback.unsavedStay")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => blocker.proceed?.()}
            >
              {t("feedback.unsavedLeave")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {feedbacks?.map((f) => (
        <Card key={f.id}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{f.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(f.createdAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}
            </p>
          </CardContent>
        </Card>
      ))}

      {feedbacks?.length === 0 && (
        <EmptyState icon={MessageSquare} title={t("feedback.noFeedback")} />
      )}
    </div>
  );
}
