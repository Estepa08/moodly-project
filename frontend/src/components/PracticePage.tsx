import { Wind, Heart, Moon, Brain, Sparkles, type LucideIcon } from "lucide-react";

const PRACTICE_ICONS: Record<string, LucideIcon> = {
  Wind,
  Heart,
  Moon,
  Brain,
};

interface PracticePageProps {
  icon: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function PracticePage({ icon, title, description, children }: PracticePageProps) {
  const Icon = PRACTICE_ICONS[icon] ?? Sparkles;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-neumorphic-sm">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground font-serif">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
