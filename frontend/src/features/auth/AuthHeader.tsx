import { Heart } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center space-y-3">
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart aria-hidden="true" className="w-6 h-6 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-serif font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <div className="mx-auto max-w-sm rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          {subtitle}
        </div>
      )}
    </div>
  );
}
