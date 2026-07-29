import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "./card";
import Spinner from "./spinner";

interface LoadingCardProps {
  className?: string;
  spinnerSize?: number;
  children?: ReactNode;
}

export function LoadingCard({ className, spinnerSize = 32, children }: LoadingCardProps) {
  return (
    <Card className={cn("shadow-neumorphic", className)}>
      <CardContent className="flex justify-center py-8">
        {children ?? <Spinner size={spinnerSize} />}
      </CardContent>
    </Card>
  );
}
