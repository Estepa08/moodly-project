import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useState } from "react";

interface FeedbackItem {
  id: string;
  message: string;
  createdAt: string;
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
}

export default function FeedbackPage({ navigate }: Props) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: feedbacks } = useQuery<FeedbackItem[]>({
    queryKey: ["feedback"],
    queryFn: () => api.feedback.listMine() as Promise<FeedbackItem[]>,
  });

  const submitFeedback = useMutation({
    mutationFn: () => api.feedback.create({ message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setMessage("");
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">{t("feedback.title")}</h1>
        <Button variant="ghost" onClick={() => navigate("dashboard")}>{t("common.back")}</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("feedback.sendFeedback")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("feedback.yourMessage")}</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("feedback.placeholder")} />
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
    </div>
  );
}
