import { useTranslation } from "react-i18next";
import { Check, Award } from "lucide-react";
import { Chip } from "../../components/ui/chip";

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
      <Chip variant={!activeTitle ? "active" : "default"} onClick={() => onSelect(null)}>
        {t("progress.noTitle")}
        {!activeTitle && <Check aria-hidden="true" className="w-3 h-3" />}
      </Chip>
      {titles.map((title) => {
        const labelKey = TITLE_MAP[title] ?? title;
        const isActive = activeTitle === title;
        return (
          <Chip
            key={title}
            variant={isActive ? "active" : "default"}
            onClick={() => onSelect(title)}
          >
            <Award aria-hidden="true" className="w-3 h-3" />
            {t(labelKey)}
            {isActive && <Check aria-hidden="true" className="w-3 h-3" />}
          </Chip>
        );
      })}
    </div>
  );
}
