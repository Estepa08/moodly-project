import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useState } from "react";

interface OnboardingStory {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Props {
  navigate: (page: string) => void;
}

export default function OnboardingPage({ navigate }: Props) {
  const [step, setStep] = useState(0);

  const { data: stories } = useQuery<OnboardingStory[]>({
    queryKey: ["onboarding"],
    queryFn: () => api.onboarding.list() as Promise<OnboardingStory[]>,
  });

  if (!stories || stories.length === 0) {
    navigate("dashboard");
    return null;
  }

  const current = stories[step];
  const isLast = step === stories.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center gap-1.5">
            {stories.map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full ${i === step ? "bg-moodly-600" : "bg-zinc-200"}`} />
            ))}
          </div>
          <h2 className="text-xl font-semibold text-zinc-800">{current.title}</h2>
          <p className="text-zinc-600">{current.content}</p>
          <Button onClick={() => (isLast ? navigate("dashboard") : setStep(step + 1))}>
            {isLast ? "Get Started" : "Next"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
