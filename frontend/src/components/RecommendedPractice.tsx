import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Wind, Heart, Moon, Brain, Sparkles, X, ArrowRight, type LucideIcon } from "lucide-react";
import { useRecommendation, useRecordRecommendationAction } from "../hooks/useRecommendation";
import { Card, CardContent } from "./ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  Wind,
  Heart,
  Moon,
  Brain,
};

export default function RecommendedPractice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: recommendation, isLoading } = useRecommendation();
  const recordAction = useRecordRecommendationAction();
  const hasRecordedShown = useRef(false);

  useEffect(() => {
    if (recommendation && !hasRecordedShown.current) {
      recordAction.mutate({ practiceId: recommendation.practiceId, action: "shown" });
      hasRecordedShown.current = true;
    }
  }, [recommendation, recordAction]);

  if (isLoading || !recommendation) return null;

  const Icon = ICON_MAP[recommendation.icon] ?? Sparkles;

  const handleTake = () => {
    recordAction.mutate({ practiceId: recommendation.practiceId, action: "taken" });
    navigate(recommendation.route);
  };

  const handleDismiss = () => {
    recordAction.mutate({ practiceId: recommendation.practiceId, action: "dismissed" });
  };

  return (
    <Card className="shadow-neumorphic overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-neumorphic-sm">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/90 leading-relaxed">
                {t(recommendation.message)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleTake}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl shadow-neumorphic-sm cursor-pointer hover:opacity-90 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("recommendation.take")}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground rounded-xl cursor-pointer hover:text-foreground hover:bg-muted/50 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-3.5 h-3.5" />
              {t("recommendation.dismiss")}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
