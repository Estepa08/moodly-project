import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "../lib/api-types";
import { PARAM_ICON_CONFIGS } from "../lib/quickEntryIcons";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Slider } from "./ui/slider";

type Entry = components["schemas"]["Entry"];

interface QuickEntryIconsProps {
  createEntry: UseMutationResult<Entry, Error, { parameterId: string; value: number; note?: string }, unknown>;
  numericParams: components["schemas"]["Parameter"][] | undefined;
  hasEntries: boolean;
}

export default function QuickEntryIcons({ createEntry, numericParams, hasEntries }: QuickEntryIconsProps) {
  const { t } = useTranslation();
  const [selectedParam, setSelectedParam] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(5);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const noteInputRef = useRef<HTMLInputElement>(null);

  const configs = PARAM_ICON_CONFIGS.filter((cfg) =>
    numericParams?.some((p) => p.name === cfg.parameterName),
  );

  const handleParamTap = useCallback((name: string) => {
    setSelectedParam((prev) => (prev === name ? null : name));
    setSliderValue(5);
    setShowNote(false);
    setNoteText("");
  }, []);

  const handleSave = useCallback(
    (parameterName: string, value: number) => {
      const param = numericParams?.find((p) => p.name === parameterName);
      if (!param) return;

      const payload: { parameterId: string; value: number; note?: string } = {
        parameterId: param.id,
        value,
      };

      if (noteText.trim()) {
        payload.note = noteText.trim();
      }

      createEntry.mutate(payload, {
        onSuccess: () => {
          toast.success(t("dashboard.quickEntry.entrySaved"));
          setSelectedParam(null);
          setShowNote(false);
          setNoteText("");
        },
        onError: () => {
          toast.error(t("dashboard.quickEntry.saveError"));
        },
      });
    },
    [createEntry, numericParams, t, noteText],
  );

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-serif">
          <Sparkles className="w-4 h-4 text-accent" />
          {t("dashboard.quickEntry.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasEntries && (
          <p className="text-[11px] text-muted-foreground text-center">
            {t("dashboard.quickEntry.firstTimeHint")}
          </p>
        )}
        <div className="flex justify-center gap-3">
          {configs.map((cfg) => {
            const isActive = selectedParam === cfg.parameterName;
            return (
              <button
                key={cfg.parameterName}
                onClick={() => handleParamTap(cfg.parameterName)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-neumorphic-sm scale-105"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 hover:shadow-neumorphic-sm"
                }`}
                aria-label={t(cfg.labelKey)}
                aria-pressed={isActive}
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  {cfg.icon}
                </div>
                <span className="text-[11px] font-medium leading-tight text-center">
                  {t(cfg.labelKey)}
                </span>
              </button>
            );
          })}
        </div>

        {selectedParam && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            {(() => {
              const cfg = configs.find((c) => c.parameterName === selectedParam);
              if (!cfg) return null;

              return (
                <div className="space-y-3">
                  <div className="px-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold font-serif text-primary">
                        {sliderValue}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[sliderValue]}
                      onValueChange={([v]) => setSliderValue(v)}
                      disabled={createEntry.isPending}
                    />
                    <div className="flex justify-between px-0.5">
                      {Array.from({ length: 11 }, (_, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground w-3 text-center">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => handleSave(cfg.parameterName, sliderValue)}
                      disabled={createEntry.isPending}
                      className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        createEntry.isPending
                          ? "opacity-50 pointer-events-none bg-primary/5"
                          : "bg-primary text-primary-foreground hover:opacity-90 shadow-neumorphic-sm"
                      }`}
                    >
                      {t("dashboard.quickEntry.save")}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {!showNote ? (
                      <button
                        onClick={() => {
                          setShowNote(true);
                          setTimeout(() => noteInputRef.current?.focus(), 100);
                        }}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-1"
                        aria-label={t("dashboard.quickEntry.addNote")}
                      >
                        <Plus className="w-3 h-3" />
                        {t("dashboard.quickEntry.addNote")}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          ref={noteInputRef}
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={t("dashboard.quickEntry.notePlaceholder")}
                          className="w-40 text-xs bg-muted rounded-lg px-2.5 py-1.5 border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSave(cfg.parameterName, sliderValue);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {createEntry.isPending && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
