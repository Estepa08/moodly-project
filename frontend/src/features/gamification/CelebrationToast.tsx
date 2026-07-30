import { Sparkles } from "lucide-react";

interface CelebrationToastProps {
  title: string;
  description?: string;
}

export default function CelebrationToast({ title, description }: CelebrationToastProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-card-gradient shadow-elevation-3 border border-border">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Sparkles aria-hidden="true" className="w-4 h-4 text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
