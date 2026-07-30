import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { ComponentSize } from "../../lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: LucideIcon;
  iconSize?: ComponentSize;
  iconBg?: string;
  iconColor?: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  hideClose?: boolean;
  preventClose?: boolean;
}

const iconSizeMap: Record<ComponentSize, { container: string; icon: string }> = {
  [ComponentSize.Sm]: { container: "w-10 h-10", icon: "w-5 h-5" },
  [ComponentSize.Md]: { container: "w-12 h-12", icon: "w-6 h-6" },
};

export function ModalShell({
  open,
  onOpenChange,
  icon: Icon,
  iconSize = ComponentSize.Sm,
  iconBg,
  iconColor,
  title,
  description,
  children,
  className,
  hideClose,
  preventClose,
}: ModalShellProps) {
  const size = iconSizeMap[iconSize];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={className ?? "max-w-sm"}
        hideClose={hideClose}
        onInteractOutside={preventClose ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {Icon && (
              <div
                className={cn(
                  "rounded-full flex items-center justify-center",
                  size.container,
                  iconBg ?? "bg-primary/10",
                )}
              >
                <Icon className={cn(size.icon, iconColor ?? "text-primary")} />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
