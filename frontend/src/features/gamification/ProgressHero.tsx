import { useTranslation } from "react-i18next";
import Lottie from "lottie-react";
import creatureAnimation from "../../assets/lottie/breathing-creature.json";
import { StreakIndicator } from "./index";
import { ProgressBar } from "../../components/ui/progress-bar";
import { EXP_PER_LEVEL } from "../../lib/constants";
import type { CreatureState } from "../../lib/api";

interface ProgressHeroProps {
  creature: CreatureState;
}

export default function ProgressHero({ creature }: ProgressHeroProps) {
  const { t } = useTranslation();
  const nextLevelExp = creature.level * EXP_PER_LEVEL;
  const expPercent = Math.min(100, Math.round((creature.experience / nextLevelExp) * 100));

  return (
    <div className="rounded-2xl bg-card shadow-neumorphic p-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
          <Lottie
            animationData={creatureAnimation}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-primary/10 text-xs font-bold text-primary">
              {t("creature.level", { level: creature.level })}
            </span>
            <StreakIndicator streak={creature.streak} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar
                segments={[
                  {
                    value: expPercent,
                    className:
                      "rounded-full bg-primary shadow-neumorphic-sm transition-[width] duration-300",
                  },
                ]}
                height={4}
                trackClassName="bg-muted"
              />
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums font-medium whitespace-nowrap">
              {creature.experience}/{nextLevelExp} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
