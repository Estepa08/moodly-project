import { Button, type ButtonProps } from "./button";
import { cn } from "../../lib/utils";

interface IconButtonProps extends Omit<ButtonProps, "size"> {
  label: string;
  size?: "icon" | "icon-sm";
}

export function IconButton({ label, size = "icon", className, ...props }: IconButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      aria-label={label}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
