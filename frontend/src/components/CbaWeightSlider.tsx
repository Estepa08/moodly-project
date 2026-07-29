import { useTranslation } from "react-i18next";
import { ProgressBar } from "./ui/progress-bar";
import { Slider } from "./ui/slider";

interface CbaWeightSliderProps {
  prosWeight: number;
  onChange: (prosWeight: number) => void;
}

export default function CbaWeightSlider({ prosWeight, onChange }: CbaWeightSliderProps) {
  const { t } = useTranslation();
  const consWeight = 100 - prosWeight;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("cba.pros")}</span>
        <span>{t("cba.cons")}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="text-lg font-bold font-serif text-accent w-10 text-right">
          {prosWeight}
        </span>
        <Slider
          className="flex-1"
          min={0}
          max={100}
          step={5}
          value={[prosWeight]}
          onValueChange={([v]) => onChange(v)}
          style={{ ["--slider-fill" as string]: "hsl(var(--accent))" }}
        />
        <span className="text-lg font-bold font-serif text-destructive w-10">{consWeight}</span>
      </div>
      <ProgressBar
        segments={[
          { value: prosWeight, className: "bg-accent" },
          { value: consWeight, className: "bg-destructive" },
        ]}
      />
    </div>
  );
}
