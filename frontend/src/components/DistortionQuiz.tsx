import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "../lib/api-types";
import { QUIZ_ITEMS, pickOptions, shuffle, type DistortionKey } from "../lib/distortionsQuiz";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type Entry = components["schemas"]["Entry"];

interface DistortionQuizProps {
  parameterId?: string;
  createEntry?: UseMutationResult<Entry, Error, { parameterId: string; value: number; note?: string }, unknown>;
}

export default function DistortionQuiz({ parameterId, createEntry }: DistortionQuizProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState(() => shuffle(QUIZ_ITEMS));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<DistortionKey | null>(null);
  const [score, setScore] = useState(0);
  const savedRef = useRef(false);

  const current = order[index];
  const options = useMemo(() => (current ? pickOptions(current.distortion) : []), [current]);
  const isAnswered = selected !== null;
  const isDone = index >= order.length;

  useEffect(() => {
    if (isDone && !savedRef.current && parameterId && createEntry) {
      savedRef.current = true;
      createEntry.mutate({ parameterId, value: score, note: `${score}/${order.length}` });
    }
  }, [isDone, parameterId, createEntry, score, order.length]);

  const handleSelect = (key: DistortionKey) => {
    if (isAnswered || !current) return;
    setSelected(key);
    if (key === current.distortion) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    setIndex((i) => i + 1);
  };

  const handleRestart = () => {
    savedRef.current = false;
    setOrder(shuffle(QUIZ_ITEMS));
    setIndex(0);
    setSelected(null);
    setScore(0);
  };

  if (isDone) {
    return (
      <Card className="shadow-neumorphic">
        <CardContent className="text-center py-8 space-y-4">
          <p className="text-lg font-semibold text-foreground font-serif">
            {t("distortionsQuiz.scoreSummary", { score, total: order.length })}
          </p>
          <Button onClick={handleRestart}>{t("distortionsQuiz.tryAgain")}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("distortionsQuiz.question")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("distortionsQuiz.intro")}</p>
        <p className="text-sm font-medium text-foreground">{t(`distortionsQuiz.${current.id}`)}</p>

        <div className="space-y-2">
          {options.map((key) => {
            const isCorrectOption = key === current.distortion;
            const isSelectedOption = key === selected;
            return (
              <Button
                key={key}
                variant={isSelectedOption ? "default" : "outline"}
                className={cn(
                  "w-full justify-start h-auto py-3 px-4 relative transition-all duration-150",
                  isAnswered && isCorrectOption && "bg-accent/10 border-accent text-accent shadow-neumorphic-inset",
                  isAnswered && isSelectedOption && !isCorrectOption && "bg-destructive/10 border-destructive text-destructive shadow-neumorphic-inset",
                )}
                onClick={() => handleSelect(key)}
                disabled={isAnswered}
              >
                {t(`cognitiveDistortions.${key}`)}
                {isAnswered && isCorrectOption && (
                  <Check className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2" />
                )}
                {isAnswered && isSelectedOption && !isCorrectOption && (
                  <X className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </Button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", selected === current.distortion ? "text-accent" : "text-destructive")}>
              {selected === current.distortion ? t("distortionsQuiz.correct") : t("distortionsQuiz.incorrect")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(`distortionsLibrary.${current.distortion}.definition`)}
            </p>
            <Button className="w-full" onClick={handleNext}>
              {index + 1 >= order.length ? t("distortionsQuiz.finish") : t("distortionsQuiz.next")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
