import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Spinner from "./ui/spinner";
import type { components } from "../lib/api-types";

type Entry = components["schemas"]["Entry"];

interface EntryHistoryProps {
  selectedParam: string;
  entries: Entry[];
  isLoading: boolean;
}

export default function EntryHistory({ selectedParam, entries, isLoading }: EntryHistoryProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.history")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedParam ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.select")}</p>
        ) : isLoading ? (
          <div className="flex justify-center py-8"><Spinner size={32} /></div>
        ) : entries.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={entries.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis
                dataKey="createdAt"
                tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
                fontSize={10}
                stroke="hsl(var(--chart-tick))"
              />
              <YAxis fontSize={10} stroke="hsl(var(--chart-tick))" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noEntries")}</p>
        )}
      </CardContent>
    </Card>
  );
}
