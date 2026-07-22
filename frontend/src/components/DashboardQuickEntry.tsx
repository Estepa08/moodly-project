import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sun, Check, Clock } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "../lib/api-types";
import { PARAM_NAME_KEYS, SLIDER_MIN, SLIDER_MAX, SLIDER_STEP, CLICK_THRESHOLD, LOCKOUT_DURATION_MS, CLICK_WINDOW_MS } from "../lib/constants";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Parameter = components["schemas"]["Parameter"];
type Entry = components["schemas"]["Entry"];

interface DashboardQuickEntryProps {
  params: Parameter[] | undefined;
  moodValue: number[];
  onMoodChange: (value: number[]) => void;
  createEntry: UseMutationResult<Entry, Error, { parameterId: string; value: number }, unknown>;
}

export default function DashboardQuickEntry({
  params,
  moodValue,
  onMoodChange,
  createEntry,
}: DashboardQuickEntryProps) {
  const { t } = useTranslation();
  const isSavingRef = useRef(false);
  const clickCountRef = useRef(0);
  const clickWindowRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const checkmarkTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSaveTimestamps = useRef<Map<string, number>>(new Map());
  const [selectedParam, setSelectedParam] = useState("");
  const [isShowSaved, setIsShowSaved] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [recentWarning, setRecentWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isShowSaved || showCheckmark) {
      setIsShowSaved(false);
      setShowCheckmark(false);
    }
    setRecentWarning(null);
  }, [selectedParam, moodValue[0]]);

  const handleSave = () => {
    if (isLocked) return;

    clickCountRef.current++;
    if (clickCountRef.current >= CLICK_THRESHOLD) {
      setIsLocked(true);
      toast.warning(t("dashboard.tooFast"));
      setTimeout(() => { setIsLocked(false); clickCountRef.current = 0; }, LOCKOUT_DURATION_MS);
      return;
    }
    clearTimeout(clickWindowRef.current);
    clickWindowRef.current = setTimeout(() => { clickCountRef.current = 0; }, CLICK_WINDOW_MS);

    if (isShowSaved) {
      setIsShowSaved(false);
      setSelectedParam("");
      return;
    }

    if (!selectedParam) {
      toast.error(t("dashboard.selectParamFirst"));
      return;
    }

    if (isSavingRef.current) return;
    isSavingRef.current = true;

    const lastTs = lastSaveTimestamps.current.get(selectedParam);
    if (lastTs && Date.now() - lastTs < 10 * 60 * 1000) {
      const minutes = Math.round((Date.now() - lastTs) / 60000);
      const key = minutes === 1 ? "dashboard.recentEntry_1" : "dashboard.recentEntry";
      setRecentWarning(t(key, { minutes }));
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => setRecentWarning(null), 4000);
    } else {
      setRecentWarning(null);
    }

    createEntry.mutate(
      { parameterId: selectedParam, value: moodValue[0] },
      {
        onSuccess: () => {
          lastSaveTimestamps.current.set(selectedParam, Date.now());
          setPulseKey((k) => k + 1);
          setShowCheckmark(true);
          toast.success(t("dashboard.entrySaved"));
          checkmarkTimerRef.current = setTimeout(() => {
            setShowCheckmark(false);
            setIsShowSaved(true);
          }, 1500);
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
          <Select value={selectedParam} onValueChange={setSelectedParam}>
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
            <span className="text-muted-foreground text-xs">{t("dashboard.moodLow")}</span>
            <span
              key={pulseKey}
              className="text-lg font-bold font-serif"
            >
              <span className={pulseKey > 0 ? "inline-block animate-value-pulse" : ""}>
                {moodValue[0].toFixed(1)}
              </span>
            </span>
            <span className="text-muted-foreground text-xs">{t("dashboard.moodHigh")}</span>
          </div>
          <Slider
            value={moodValue}
            onValueChange={onMoodChange}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            style={{ "--slider-fill": "hsl(var(--primary) / 0.6)" } as React.CSSProperties}
          />
        </div>

        {recentWarning && (
          <p className="text-xs text-accent text-center flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/15 -mt-1 animate-in fade-in slide-in-from-top-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {recentWarning}
          </p>
        )}

        <Button
          className="w-full"
          variant={isShowSaved ? "secondary" : "default"}
          disabled={createEntry.isPending || isLocked}
          onClick={handleSave}
        >
          {createEntry.isPending ? (
            t("common.saving")
          ) : showCheckmark ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>{t("dashboard.entrySaved")}</span>
            </span>
          ) : isShowSaved ? (
            t("dashboard.saveAnother")
          ) : (
            t("dashboard.save")
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
