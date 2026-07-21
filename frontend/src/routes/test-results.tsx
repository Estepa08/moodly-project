import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

interface TestResult {
  id: string;
  testId: string;
  score: number;
  interpretation: string;
  recommendation: string;
  completedAt: string;
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
}

export default function TestResultsPage({ navigate }: Props) {
  const { data: results } = useQuery<TestResult[]>({
    queryKey: ["test-results"],
    queryFn: () => api.testResults.list() as Promise<TestResult[]>,
  });

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-moodly-700">Test Results</h1>
        <Button variant="ghost" onClick={() => navigate("dashboard")}>Back</Button>
      </header>

      {results?.length === 0 && (
        <p className="text-zinc-400 text-center py-8">No test results yet.</p>
      )}

      {results?.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{r.interpretation}</span>
              <span className="text-sm font-mono text-moodly-700">{r.score}</span>
            </CardTitle>
            <p className="text-xs text-zinc-400">{new Date(r.completedAt).toLocaleDateString()}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{r.recommendation}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
