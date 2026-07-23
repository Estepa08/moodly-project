import { Loader2 } from "lucide-react";

interface Props {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 20, className = "" }: Props) {
  return (
    <Loader2
      role="status"
      aria-live="polite"
      className={`animate-spin text-primary ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
