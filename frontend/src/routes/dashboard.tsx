import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Parameter {
  id: string;
  name: string;
  description?: string;
  unit?: string;
}

interface Entry {
  id: string;
  parameterId: string;
  value: number;
  note?: string;
  createdAt: string;
}

interface Props {
  navigate: (page: string, params?: Record<string, string>) => void;
  onLogout: () => void;
}

export default function Dashboard({ navigate, onLogout }: Props) {
  const queryClient = useQueryClient();
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [entryValue, setEntryValue] = useState("");
  const [entryNote, setEntryNote] = useState("");

  const { data: params } = useQuery<Parameter[]>({
    queryKey: ["parameters"],
    queryFn: () => api.parameters.list() as Promise<Parameter[]>,
  });

  const { data: entries } = useQuery<Entry[]>({
    queryKey: ["entries", selectedParam],
    queryFn: () => api.entries.list({ parameterId: selectedParam || undefined }) as Promise<Entry[]>,
  });

  const createEntry = useMutation({
    mutationFn: () =>
      api.entries.create({
        parameterId: selectedParam,
        value: parseFloat(entryValue),
        note: entryNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setEntryValue("");
      setEntryNote("");
    },
  });

  const navItems = [
    { label: "Dashboard", page: "dashboard" as const },
    { label: "Tests", page: "tests" as const },
    { label: "Results", page: "test-results" as const },
    { label: "Reports", page: "reports" as const },
    { label: "Feedback", page: "feedback" as const },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-moodly-700">Moodly</h1>
        <div className="flex gap-2">
          {navItems.map((item) => (
            <Button
              key={item.page}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.page)}
            >
              {item.label}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Parameter</Label>
              <select
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value)}
              >
                <option value="">Select...</option>
                {params?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.unit ? `(${p.unit})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={entryValue}
                onChange={(e) => setEntryValue(e.target.value)}
                placeholder="0-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
                placeholder="How are you feeling?"
              />
            </div>
            <Button
              className="w-full"
              disabled={!selectedParam || !entryValue || createEntry.isPending}
              onClick={() => createEntry.mutate()}
            >
              {createEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {entries && entries.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={entries.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="createdAt"
                    tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
                    fontSize={10}
                    stroke="#a1a1aa"
                  />
                  <YAxis fontSize={10} stroke="#a1a1aa" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#16a34a" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-400 text-center py-8">No entries yet. Start tracking above.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
