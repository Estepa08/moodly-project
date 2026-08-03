import { useTranslation } from "react-i18next";
import { ProgressBar } from "../../components/ui/progress-bar";
import { Slider } from "../../components/ui/slider";

interface CbaWeightSliderProps {
  prosWeight: number;
  onChange: (prosWeight: number) => void;
}

export default function CbaWeightSlider({ prosWeight, onChange }: CbaWeightSliderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("cba.pros")}</span>
        <span>{t("cba.cons")}</span>
      </div>
      <ProgressBar
        segments={[
          { value: prosWeight, className: "bg-success" },
          { value: 100 - prosWeight, className: "bg-destructive" },
        ]}
        className="h-2"
        rounded={false}
      />
      <Slider
        aria-label={t("cba.prosWeight")}
        min={0}
        max={100}
        step={1}
        value={[prosWeight]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
