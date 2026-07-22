import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sun } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "../lib/api-types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Parameter = components["schemas"]["Parameter"];
type Entry = components["schemas"]["Entry"];

const PARAM_NAME_KEYS: Record<string, string> = {
  Anxiety: "dashboard.anxiety",
  Sleep: "dashboard.sleep",
  Mood: "dashboard.mood",
  Energy: "dashboard.energy",
  Focus: "dashboard.focus",
};

interface DashboardQuickEntryProps {
  params: Parameter[] | undefined;
  selectedParam: string;
  onParamChange: (id: string) => void;
  moodValue: number[];
  onMoodChange: (value: number[]) => void;
  createEntry: UseMutationResult<Entry, Error, { parameterId: string; value: number }, unknown>;
}

export default function DashboardQuickEntry({
  params,
  selectedParam,
  onParamChange,
  moodValue,
  onMoodChange,
  createEntry,
}: DashboardQuickEntryProps) {
  const { t } = useTranslation();
  const isSavingRef = useRef(false);
  const clickCountRef = useRef(0);
  const clickWindowRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showSaved, setShowSaved] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (showSaved) setShowSaved(false);
  }, [selectedParam, moodValue[0]]);

  const handleSave = () => {
    if (locked) return;

    if (showSaved) {
      onParamChange("");
      setShowSaved(false);
      return;
    }

    clickCountRef.current++;
    if (clickCountRef.current >= 5) {
      setLocked(true);
      toast.warning(t("dashboard.tooFast"));
      setTimeout(() => { setLocked(false); clickCountRef.current = 0; }, 5000);
      return;
    }
    clearTimeout(clickWindowRef.current);
    clickWindowRef.current = setTimeout(() => { clickCountRef.current = 0; }, 2000);

    if (!selectedParam) {
      toast.error(t("dashboard.selectParamFirst"));
      return;
    }

    if (isSavingRef.current) return;
    isSavingRef.current = true;
    createEntry.mutate(
      { parameterId: selectedParam, value: moodValue[0] },
      {
        onSuccess: () => {
          setShowSaved(true);
          toast.success(t("dashboard.entrySaved"));
        },
        onSettled: () => { isSavingRef.current = false; },
      },
    );
  };

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sun className="w-4 h-4 text-accent" />
          {t("dashboard.quickEntry")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="quick-entry-param">{t("dashboard.parameter")}</Label>
          <Select value={selectedParam} onValueChange={onParamChange}>
            <SelectTrigger id="quick-entry-param">
              <SelectValue placeholder={t("dashboard.select")} />
            </SelectTrigger>
            <SelectContent>
              {params?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {t(PARAM_NAME_KEYS[p.name] ?? p.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-destructive font-medium">{t("dashboard.moodAwful")}</span>
            <span className="text-lg font-bold font-serif text-primary">{moodValue[0].toFixed(1)}</span>
            <span className="text-accent font-medium">{t("dashboard.moodGreat")}</span>
          </div>
          <Slider
            value={moodValue}
            onValueChange={onMoodChange}
            min={0}
            max={10}
            step={0.5}
            style={{ "--slider-fill": "linear-gradient(to right, hsl(var(--destructive)), hsl(var(--severity-moderate)), hsl(var(--severity-mild)), hsl(var(--primary)), hsl(var(--accent)))" } as React.CSSProperties}
          />
        </div>

        <Button
          className="w-full"
          disabled={createEntry.isPending || locked}
          onClick={handleSave}
        >
          {createEntry.isPending ? t("common.saving") : showSaved ? t("dashboard.saveAnother") : t("dashboard.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
