import { useTranslation } from "react-i18next";
import { Check, Award } from "lucide-react";
import { cn } from "../../lib/utils";
import { useCreatureState } from "./useCreature";

interface TitleSelectorProps {
  titles: string[];
  activeTitle: string | null;
  onSelect: (title: string | null) => void;
}

const TITLE_MAP: Record<string, string> = {
  "serenity_keeper": "progress.titleSerenityKeeper",
  "spark": "progress.titleSpark",
  "sage": "progress.titleSage",
  "warrior": "progress.titleWarrior",
  "guardian": "progress.titleGuardian",
  "seeker": "progress.titleSeeker",
};

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
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !activeTitle
            ? "bg-primary/10 text-primary ring-1 ring-primary"
            : "bg-muted text-muted-foreground hover:bg-secondary cursor-pointer active:scale-[0.97]",
        )}
      >
        {t("progress.noTitle")}
        {!activeTitle && <Check className="w-3 h-3" />}
      </button>
      {titles.map((title) => {
        const labelKey = TITLE_MAP[title] ?? title;
        const isActive = activeTitle === title;
        return (
          <button
            key={title}
            onClick={() => onSelect(title)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/10 text-primary ring-1 ring-primary"
                : "bg-muted text-muted-foreground hover:bg-secondary cursor-pointer active:scale-[0.97]",
            )}
          >
            <Award className="w-3 h-3" />
            {t(labelKey)}
            {isActive && <Check className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
}
