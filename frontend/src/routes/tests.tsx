import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Spinner from "../components/ui/spinner";
import { useTestTranslation } from "../hooks/useTestTranslation";

interface Test {
  id: string;
  title: string;
  description?: string;
}

export default function TestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tTestTitle, tTestDescription } = useTestTranslation();
  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ["tests"],
    queryFn: () => api.tests.list() as Promise<Test[]>,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary font-serif">{t("tests.title")}</h1>
        <Button variant="ghost" onClick={() => navigate("/")}>{t("common.back")}</Button>
      </header>

      {tests?.map((test) => (
        <Card key={test.id} className="cursor-pointer hover:shadow-neumorphic transition-shadow" onClick={() => navigate(`/tests/${test.id}`)}>
          <CardHeader>
            <CardTitle>{tTestTitle(test.title)}</CardTitle>
            {test.description && <p className="text-sm text-muted-foreground">{tTestDescription(test.description)}</p>}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
