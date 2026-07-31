import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import PetAvatar from "../../features/gamification/PetAvatar";

interface EmptyStateProps {
  icon?: LucideIcon;
  pet?: boolean;
  petType?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  pet = false,
  petType,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-300",
        className,
      )}
    >
      {pet ? (
        <div className="mb-4">
          <PetAvatar petType={petType} size="lg" interactive ariaLabel={title} />
          <div className="mx-auto mt-2 w-16 h-2 rounded-full bg-foreground/10" aria-hidden="true" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full bg-muted shadow-neumorphic-inset flex items-center justify-center mb-4">
          <Icon aria-hidden="true" className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
