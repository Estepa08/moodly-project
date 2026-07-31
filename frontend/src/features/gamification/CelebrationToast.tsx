import { usePets } from "./useCreature";
import PetAvatar from "./PetAvatar";

interface CelebrationToastProps {
  title: string;
  description?: string;
}

export default function CelebrationToast({ title, description }: CelebrationToastProps) {
  const { data: pets } = usePets();

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card-gradient shadow-elevation-3 border border-border">
      <PetAvatar petType={pets?.activePetType ?? "puff"} size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
