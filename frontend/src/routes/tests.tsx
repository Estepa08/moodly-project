import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface Test {
  id: string;
  title: string;
  description?: string;
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
}

export default function TestsPage({ navigate }: Props) {
  const { data: tests } = useQuery<Test[]>({
    queryKey: ["tests"],
    queryFn: () => api.tests.list() as Promise<Test[]>,
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-moodly-700">Tests</h1>
        <Button variant="ghost" onClick={() => navigate("dashboard")}>Back</Button>
      </header>

      {tests?.map((test) => (
        <Card key={test.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("test-detail", { testId: test.id })}>
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            {test.description && <p className="text-sm text-zinc-500">{test.description}</p>}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
