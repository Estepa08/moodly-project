import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import type { CreateEntryMutation } from "../../lib/app-types";
import { QUIZ_ITEMS, QUIZ_PER_RUN, pickOptions, shuffle, DistortionKey } from "../../lib/distortionsQuiz";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

interface DistortionQuizProps {
  parameterId?: string;
  createEntry?: CreateEntryMutation;
}

export default function DistortionQuiz({ parameterId, createEntry }: DistortionQuizProps) {
  const { t } = useTranslation();
  const [order, setOrder] = useState(() => shuffle(QUIZ_ITEMS).slice(0, QUIZ_PER_RUN));
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
    setOrder(shuffle(QUIZ_ITEMS).slice(0, QUIZ_PER_RUN));
    setIndex(0);
    setSelected(null);
    setScore(0);
  };

  if (isDone) {
    const pct = Math.round((score / order.length) * 100);
    return (
      <Card className="shadow-neumorphic">
        <CardContent className="pt-6 text-center space-y-3">
          <Check aria-hidden="true" className="w-10 h-10 text-accent mx-auto" />
          <p className="text-lg font-bold font-serif text-foreground">{t("distortions.quizDone")}</p>
          <p className="text-sm text-muted-foreground">{t("distortions.quizScore", { score, total: order.length, pct })}</p>
          <Button onClick={handleRestart}>{t("distortions.quizRestart")}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-neumorphic">
      <CardHeader>
        <CardTitle className="text-base">{t("distortions.quizTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">{t("distortions.quizProgress", { current: index + 1, total: order.length })}</p>
        {current && (
          <>
            <p className="text-sm font-medium text-foreground">{t(`distortionsLibrary.${current.distortion}.definition`)}</p>
            <p className="text-xs text-muted-foreground">{t("distortions.whichDistortion")}</p>
            <div className="space-y-2">
              {options.map((opt) => {
                const isCorrect = opt === current.distortion;
                const isWrong = isAnswered && opt === selected && !isCorrect;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    disabled={isAnswered}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left font-medium transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isAnswered && isCorrect && "bg-accent/10 text-accent shadow-neumorphic-inset ring-2 ring-accent/60",
                      isWrong && "bg-destructive/10 text-destructive shadow-neumorphic-inset ring-2 ring-destructive/60",
                      !isAnswered && "bg-muted text-muted-foreground hover:text-foreground shadow-neumorphic-sm",
                      isAnswered && !isCorrect && !isWrong && "opacity-50",
                    )}
                  >
                    <span>{t(`cognitiveDistortions.${opt}`)}</span>
                    {isAnswered && isCorrect && <Check aria-hidden="true" className="w-4 h-4 shrink-0 text-accent" />}
                    {isWrong && <X aria-hidden="true" className="w-4 h-4 shrink-0 text-destructive" />}
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <Button onClick={handleNext} className="w-full">
                {t(index < order.length - 1 ? "distortions.next" : "distortions.finish")}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
