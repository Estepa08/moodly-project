import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface TitleSelectorProps {
  titles: string[];
  activeTitle: string | null;
  onSelect: (title: string | null) => void;
}

const TITLE_MAP: Record<string, string> = {
  serenity_keeper: "progress.titleSerenityKeeper",
  spark: "progress.titleSpark",
  sage: "progress.titleSage",
  warrior: "progress.titleWarrior",
  guardian: "progress.titleGuardian",
  seeker: "progress.titleSeeker",
  harmonist: "progress.titleHarmonist",
  phoenix: "progress.titlePhoenix",
  visionary: "progress.titleVisionary",
  breeze: "progress.titleBreeze",
  persistent: "progress.titlePersistent",
  legend: "progress.titleLegend",
};

const TITLE_EMOJI: Record<string, string> = {
  serenity_keeper: "🛡️",
  spark: "✨",
  sage: "📖",
  warrior: "⚔️",
  guardian: "🏛️",
  seeker: "🧭",
  harmonist: "🎯",
  phoenix: "🔥",
  visionary: "🔮",
  breeze: "🌬️",
  persistent: "💪",
  legend: "👑",
};

const NO_TITLE_EMOJI = "🏷️";

export default function TitleSelector({ titles, activeTitle, onSelect }: TitleSelectorProps) {
  const { t } = useTranslation();

  if (titles.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        {t("progress.noTitlesYet")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "w-full rounded-xl p-3 flex flex-col items-center gap-1.5 transition-[background-color,box-shadow,opacity,transform] duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !activeTitle
            ? "bg-primary/10 shadow-neumorphic-inset"
            : "bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]",
        )}
        aria-pressed={!activeTitle}
        aria-label={t("progress.noTitle")}
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl bg-secondary">
          {NO_TITLE_EMOJI}
        </div>
        <span className="text-xs font-medium text-center leading-tight">
          {t("progress.noTitle")}
        </span>
        {!activeTitle && (
          <span className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
            <Check aria-hidden="true" className="w-3 h-3" /> {t("pets.active")}
          </span>
        )}
      </button>

      {titles.map((title) => {
        const labelKey = TITLE_MAP[title] ?? title;
        const isActive = activeTitle === title;
        const emoji = TITLE_EMOJI[title] ?? "🎖️";
        return (
          <button
            key={title}
            type="button"
            onClick={() => onSelect(title)}
            className={cn(
              "w-full rounded-xl p-3 flex flex-col items-center gap-1.5 transition-[background-color,box-shadow,opacity,transform] duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 shadow-neumorphic-inset"
                : "bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]",
            )}
            aria-pressed={isActive}
            aria-label={t(labelKey)}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl bg-secondary">
              {emoji}
            </div>
            <span className="text-xs font-medium text-center leading-tight">{t(labelKey)}</span>
            {isActive && (
              <span className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
                <Check aria-hidden="true" className="w-3 h-3" /> {t("pets.active")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
