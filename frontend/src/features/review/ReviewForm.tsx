import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Send, Star } from "lucide-react";
import { api, type FeedbackCreate } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import Spinner from "../../components/ui/spinner";
import { cn } from "../../lib/utils";

const STAR_COUNT = 5;

export default function ReviewForm() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: feedback,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myFeedback"],
    queryFn: () => api.feedback.listMine(),
  });

  const existing = feedback && feedback.length > 0 ? feedback[0] : undefined;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (existing) {
      setRating(existing.rating);
      setMessage(existing.message);
      setShowSuccess(false);
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (body: FeedbackCreate) => api.feedback.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFeedback"] });
      setShowSuccess(true);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : t("review.submitFailed"));
    },
  });

  const handleSubmit = () => {
    if (rating < 1 || message.trim().length === 0) {
      setFormError(t("review.errorRequired"));
      return;
    }
    setFormError("");
    setShowSuccess(false);
    mutation.mutate({ rating, message: message.trim() });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={28} />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {t("review.loadFailed")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {showSuccess && existing ? (
        <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
          <p className="text-sm font-medium text-foreground">{t("review.thanks")}</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((value) => (
              <Star
                key={value}
                aria-hidden="true"
                className={cn(
                  "w-4 h-4",
                  value <= existing.rating
                    ? "text-warning fill-warning"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          <p className="text-sm text-foreground">{existing.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowSuccess(false);
              setHover(0);
            }}
          >
            <Pencil aria-hidden="true" className="w-4 h-4 mr-1.5" />
            {t("review.edit")}
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-foreground">{t("review.prompt")}</p>

          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label={t("review.prompt")}
          >
            {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((value) => {
              const active = (hover || rating) >= value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={t("review.starLabel", { value })}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                  onFocus={() => setHover(value)}
                  onBlur={() => setHover(0)}
                  className="w-11 h-11 flex items-center justify-center rounded-lg transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    aria-hidden="true"
                    className={cn(
                      "w-7 h-7 transition-colors duration-150",
                      active ? "text-warning fill-warning" : "text-muted-foreground/30",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("review.placeholder")}
            rows={4}
            maxLength={1000}
            aria-label={t("review.placeholder")}
          />

          {(formError || mutation.isError) && (
            <p className="text-sm text-destructive" role="alert">
              {formError || (mutation.error instanceof Error ? mutation.error.message : "")}
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            <Send aria-hidden="true" className="w-4 h-4 mr-2" />
            {mutation.isPending ? t("review.submitting") : t("review.submit")}
          </Button>
        </>
      )}
    </div>
  );
}
