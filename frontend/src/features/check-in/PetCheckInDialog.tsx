import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import PetAvatar from "../gamification/PetAvatar";
import { usePets, useCreatureState, celebrate } from "../gamification";
import { PET_DEFINITIONS } from "../gamification/pets";
import { api } from "../../lib/api";
import { useParameters } from "../../hooks/useParameters";
import { useCreateEntry } from "../../hooks/useEntries";
import { useDayPhase, getDayPhase, type DayPhase } from "../../hooks/useDayPhase";
import { ParameterName, PARAM_NAME_KEYS } from "../../lib/constants";
import { RATING_LEVELS, type RatingLevel } from "../../lib/ratingLevels";
import { cn } from "../../lib/utils";

const FLOWS: Record<DayPhase, ParameterName[]> = {
  morning: [ParameterName.Mood, ParameterName.Sleep, ParameterName.Energy, ParameterName.Anxiety],
  day: [ParameterName.Mood, ParameterName.Energy],
  evening: [ParameterName.Mood, ParameterName.Energy],
};

interface PetCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkActivities?: () => void;
}

export default function PetCheckInDialog({
  open,
  onOpenChange,
  onMarkActivities,
}: PetCheckInDialogProps) {
  const { t } = useTranslation();
  const phase = useDayPhase();
  const flow = FLOWS[phase];

  const queryClient = useQueryClient();
  const { data: params } = useParameters();
  const createEntry = useCreateEntry();
  const { data: pets } = usePets();
  const { data: creature } = useCreatureState();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [feedSignal, setFeedSignal] = useState(0);
  // Результат дневного чек-ина (награда XP/энергия/streak), показываем при завершении флоу.
  const [checkIn, setCheckIn] = useState<{ streak: number; leveledUp: boolean } | null>(null);

  const checkInMutation = useMutation({
    mutationFn: () => api.creature.checkIn(),
    onSuccess: (data) => {
      setCheckIn({ streak: data.state.streak ?? 0, leveledUp: data.leveledUp });
      queryClient.invalidateQueries({ queryKey: ["creature"] });
      if (data.leveledUp) {
        celebrate(t("dailyCheckIn.levelUpBody", { level: data.state.level }), {
          title: t("dailyCheckIn.levelUpTitle"),
        });
      }
    },
    onError: () => {
      // Например, ALREADY_CHECKED_IN (409) — второй чек-ин за день: награду не показываем.
      setCheckIn(null);
    },
  });

  useEffect(() => {
    if (open) {
      setStep(0);
      setDone(false);
      setFeedSignal(0);
      setCheckIn(null);
    }
  }, [open]);

  const paramIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of params ?? []) map.set(p.name, p.id);
    return map;
  }, [params]);

  const currentParam = flow[step];
  const levels = RATING_LEVELS[currentParam] ?? RATING_LEVELS[ParameterName.Mood]!;
  const paramId = paramIdByName.get(currentParam);

  const activePetType = pets?.activePetType ?? creature?.petType ?? "puff";
  const petName =
    pets?.petName?.trim() ||
    t(PET_DEFINITIONS.find((p) => p.type === activePetType)?.labelKey ?? "pets.puff");

  const handleSelect = (value: number) => {
    if (!paramId || createEntry.isPending) return;
    createEntry.mutate(
      { parameterId: paramId, value },
      {
        onSuccess: () => {
          setFeedSignal((s) => s + 1);
          if (step >= flow.length - 1) {
            setDone(true);
            // Завершение флоу = дневной чек-ин (сервер сам защищает от повтора в день).
            checkInMutation.mutate(undefined);
          } else {
            setStep((s) => s + 1);
          }
        },
      },
    );
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        overlayClassName="bg-primary/25 backdrop-blur-sm"
        className="pet-gradient-bg text-foreground rounded-3xl max-w-sm w-[calc(100%-2rem)] p-5 text-center overflow-visible"
      >
        <div className="flex justify-center">
          <PetAvatar
            petType={activePetType}
            size="lg"
            interactive
            feedSignal={feedSignal}
            emotion="happy"
            ariaLabel={petName}
          />
        </div>

        {done ? (
          <div className="space-y-3">
            <p className="text-lg font-bold font-serif text-foreground">
              {t("petCheckIn.thanksTitle")}
            </p>
            <p className="text-sm text-muted-foreground leading-snug">
              {t("petCheckIn.thanksText")}
            </p>

            {checkIn && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-accent/10 py-2.5">
                    <span className="text-sm font-bold text-accent">
                      {t("petCheckIn.rewardXp")}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary/10 py-2.5">
                    <span className="text-sm font-bold text-primary">
                      {t("petCheckIn.rewardEnergy")}
                    </span>
                  </div>
                </div>
                {checkIn.streak > 0 && (
                  <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-card shadow-neumorphic-sm py-2">
                    <Flame aria-hidden="true" className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-foreground">
                      {t("petCheckIn.rewardStreak", { count: checkIn.streak })}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={close}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-neumorphic-sm transition-[transform,filter] duration-150 hover:brightness-105 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("petCheckIn.done")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-card shadow-neumorphic-sm px-4 py-3">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {t(`petGreeter.question.${phase}`)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("petCheckIn.instantHint")}</p>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-1">
              {flow.map((p, i) => (
                <span
                  key={p}
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === step ? "w-5 bg-primary" : "w-2 bg-primary/30",
                  )}
                />
              ))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground">
              {t("petCheckIn.stepOf", { current: step + 1, total: flow.length })} ·{" "}
              {t(PARAM_NAME_KEYS[currentParam])}
            </p>

            <div className="grid grid-cols-5 gap-1.5">
              {levels.map((lv: RatingLevel) => {
                const Icon = lv.Icon;
                return (
                  <button
                    key={lv.value}
                    type="button"
                    onClick={() => handleSelect(lv.value)}
                    disabled={createEntry.isPending}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-2xl bg-card shadow-neumorphic-sm h-16 px-1",
                      "transition-[transform,box-shadow] duration-150 active:scale-95 hover:shadow-neumorphic",
                      "cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <Icon aria-hidden="true" className="w-6 h-6 text-primary" />
                    <span className="text-[10px] font-medium text-foreground leading-tight text-center">
                      {t(lv.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={close}
                className="text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground py-1 px-2 min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
              >
                {t("petCheckIn.skip")}
              </button>
              {phase !== "morning" && onMarkActivities && (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onMarkActivities();
                  }}
                  className="text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80 py-1 px-2 min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                >
                  {t("petCheckIn.markActivities")}
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function shouldAutoOpenCheckIn(
  savedTodayParamIds: Set<string>,
  paramIdByName: Map<string, string>,
): boolean {
  const phase = getDayPhase();
  const firstParam = FLOWS[phase][0];
  const firstParamId = paramIdByName.get(firstParam);
  if (firstParamId && savedTodayParamIds.has(firstParamId)) return false;
  const today = new Date().toISOString().slice(0, 10);
  const key = `moodly_pet_checkin_${phase}_${today}`;
  try {
    return localStorage.getItem(key) !== "1";
  } catch {
    return true;
  }
}

export function markCheckInDone() {
  const phase = getDayPhase();
  const today = new Date().toISOString().slice(0, 10);
  try {
    localStorage.setItem(`moodly_pet_checkin_${phase}_${today}`, "1");
  } catch {
    /* noop */
  }
}
