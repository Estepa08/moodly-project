import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { useRecommendations } from "../hooks/useRecommendations";

export default function InsightBanner() {
  const navigate = useNavigate();
  const recommendations = useRecommendations();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const topRec = recommendations.find((r) => !dismissed.has(r.id));
  if (!topRec) return null;

  const Icon = topRec.icon;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 p-4 rounded-xl bg-card shadow-neumorphic cursor-pointer",
        "transition-all duration-150 active:scale-[0.97]",
      )}
      onClick={() => navigate(topRec.actionPath)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(topRec.actionPath);
        }
      }}
    >
      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{topRec.title}</p>
        <p className="text-xs text-muted-foreground">{topRec.description}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDismissed((prev) => new Set(prev).add(topRec.id));
        }}
        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
