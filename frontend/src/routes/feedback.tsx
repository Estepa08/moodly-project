import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import Spinner from "../components/ui/spinner";
import { useState } from "react";

interface FeedbackItem {
  id: string;
  message: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: feedbacks, isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["feedback"],
    queryFn: () => api.feedback.listMine() as Promise<FeedbackItem[]>,
  });

  const submitFeedback = useMutation({
    mutationFn: () => api.feedback.create({ message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setMessage("");
      toast.success(t("feedback.sent"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground font-serif">{t("feedback.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("feedback.sendFeedback")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("feedback.yourMessage")}</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("feedback.placeholder")}
              className="flex min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-neumorphic-inset placeholder:text-muted-foreground resize-y"
            />
          </div>
          <Button disabled={!message || submitFeedback.isPending} onClick={() => submitFeedback.mutate()}>
            {submitFeedback.isPending ? t("common.sending") : t("feedback.send")}
          </Button>
        </CardContent>
      </Card>

      {feedbacks?.map((f) => (
        <Card key={f.id}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{f.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(f.createdAt).toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US")}</p>
          </CardContent>
        </Card>
      ))}

      {feedbacks?.length === 0 && (
        <p className="text-muted-foreground text-center py-8">{t("feedback.noFeedback")}</p>
      )}
    </div>
  );
}
