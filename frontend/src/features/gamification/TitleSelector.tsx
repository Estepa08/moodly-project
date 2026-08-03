import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface TitleSelectorProps {
  titles: string[];
  activeTitle: string | null;
  onSelect: (title: string | null) => void;
}

export const TITLE_MAP: Record<string, string> = {
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
  mentor: "progress.titleMentor",
  chronicle: "progress.titleChronicle",
  trailblazer: "progress.titleTrailblazer",
  zenmonk: "progress.titleZenmonk",
  nightOwl: "progress.titleNightOwl",
  caretaker: "progress.titleCaretaker",
  mystic: "progress.titleMystic",
  lucid: "progress.titleLucid",
  titan: "progress.titleTitan",
  iron_will: "progress.titleIronWill",
  luminary: "progress.titleLuminary",
  breath_guru: "progress.titleBreathGuru",
  habit_architect: "progress.titleHabitArchitect",
  mood_keeper: "progress.titleMoodKeeper",
  sunbeam: "progress.titleSunbeam",
  soul_scribe: "progress.titleSoulScribe",
  know_thyself: "progress.titleKnowThyself",
  stargazer: "progress.titleStargazer",
};

export const TITLE_EMOJI: Record<string, string> = {
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
  mentor: "🎓",
  chronicle: "📜",
  trailblazer: "🛤️",
  zenmonk: "🧘",
  nightOwl: "🌙",
  caretaker: "🌱",
  mystic: "🌀",
  lucid: "💡",
  titan: "🗿",
  iron_will: "🏔️",
  luminary: "🌟",
  breath_guru: "🫧",
  habit_architect: "🧱",
  mood_keeper: "🎭",
  sunbeam: "🌻",
  soul_scribe: "📝",
  know_thyself: "🔍",
  stargazer: "🌠",
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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "relative w-full rounded-xl p-3 flex flex-col items-center gap-1.5 transition-[background-color,box-shadow,transform] duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "min-h-[96px]",
          !activeTitle
            ? "bg-card shadow-neumorphic-inset border-2 border-primary"
            : "bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]",
        )}
        aria-pressed={!activeTitle}
        aria-label={t("progress.noTitle")}
      >
        {!activeTitle && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check aria-hidden="true" className="w-3 h-3" strokeWidth={3} />
          </span>
        )}
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl bg-secondary">
          {NO_TITLE_EMOJI}
        </div>
        <span className="text-xs font-medium text-center leading-tight line-clamp-1">
          {t("progress.noTitle")}
        </span>
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
              "relative w-full rounded-xl p-3 flex flex-col items-center gap-1.5 transition-[background-color,box-shadow,transform] duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "min-h-[96px]",
              isActive
                ? "bg-card shadow-neumorphic-inset border-2 border-primary"
                : "bg-card shadow-neumorphic-sm cursor-pointer hover:shadow-elevation-2 active:scale-[0.97]",
            )}
            aria-pressed={isActive}
            aria-label={t(labelKey)}
          >
            {isActive && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check aria-hidden="true" className="w-3 h-3" strokeWidth={3} />
              </span>
            )}
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl bg-secondary">
              {emoji}
            </div>
            <span className="text-xs font-medium text-center leading-tight line-clamp-1">
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}