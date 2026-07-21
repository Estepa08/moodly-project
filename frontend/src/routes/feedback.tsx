import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
        <h1 className="text-xl font-bold text-moodly-700">Feedback</h1>
        <Button variant="ghost" onClick={() => navigate("dashboard")}>Back</Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Send Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Your message</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your thoughts..." />
          </div>
          <Button disabled={!message || submitFeedback.isPending} onClick={() => submitFeedback.mutate()}>
            {submitFeedback.isPending ? "Sending..." : "Send"}
          </Button>
        </CardContent>
      </Card>

      {feedbacks?.map((f) => (
        <Card key={f.id}>
          <CardContent className="pt-4">
            <p className="text-sm text-zinc-600">{f.message}</p>
            <p className="text-xs text-zinc-400 mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
