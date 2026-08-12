import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { cn } from "../../lib/utils";
import { DYADS_BY_LEVEL, DYAD_COUNT_BY_LEVEL_VIEW, emotionMeta, type DyadView } from "./emotionLab";
import type { EmotionLabState } from "./useEmotionLab";

const LEVEL_LABEL_KEYS = {
  1: "emotionLab.level1",
  2: "emotionLab.level2",
  3: "emotionLab.level3",
  4: "emotionLab.level4",
} as const;

interface EmotionJournalProps {
  state: EmotionLabState;
}

export default function EmotionJournal({ state }: EmotionJournalProps) {
  const { t } = useTranslation();
  const discovered = new Set(state.discoveredDyads);
  const countByLevel = (level: 1 | 2 | 3 | 4) =>
    DYADS_BY_LEVEL[level].filter((d) => discovered.has(d.key)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-heading font-extrabold text-foreground">
          {t("emotionLab.journalTitle")}
        </h3>
        <span className="text-sm text-muted-foreground">
          {state.discoveredCount} / {state.totalDyads}
        </span>
      </div>

      <div className="space-y-5">
        {([1, 2, 3, 4] as const).map((level) => (
          <div key={level}>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t(LEVEL_LABEL_KEYS[level])}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {countByLevel(level)} / {DYAD_COUNT_BY_LEVEL_VIEW[level]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DYADS_BY_LEVEL[level].map((dyad) => (
                <DyadChip key={dyad.key} dyad={dyad} discovered={discovered.has(dyad.key)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {state.availableLevel < 4 && (
        <div className="rounded-xl bg-warning/10 border border-warning/20 px-4 py-3 text-xs text-warning">
          <p className="font-medium">{t("emotionLab.journalHint")}</p>
          <p className="mt-0.5 text-warning/90">{t("emotionLab.journalHintExamples")}</p>
        </div>
      )}
    </div>
  );
}

function DyadChip({ dyad, discovered }: { dyad: DyadView; discovered: boolean }) {
  const { t } = useTranslation();
  const [a, b] = dyad.emotions;
  const metaA = emotionMeta(a);
  const metaB = emotionMeta(b);

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-10 px-3 rounded-full border text-xs font-medium transition-colors",
        discovered
          ? "bg-primary/10 border-primary/40 text-primary"
          : "bg-muted border-border text-muted-foreground",
      )}
    >
      <span className="flex items-center gap-1 shrink-0">
        <metaA.icon
          aria-hidden="true"
          className="w-3.5 h-3.5"
          style={{ color: metaA.color }}
          strokeWidth={2.5}
        />
        <metaB.icon
          aria-hidden="true"
          className="w-3.5 h-3.5"
          style={{ color: metaB.color }}
          strokeWidth={2.5}
        />
      </span>
      {discovered ? (
        <span className="truncate">{t(`emotionLab.dyads.${dyad.key}`)}</span>
      ) : (
        <span className="flex items-center gap-1 truncate">
          <Lock aria-hidden="true" className="w-3 h-3 shrink-0" />
          {t(`emotionLab.dyads.${dyad.key}`)}
        </span>
      )}
    </div>
  );
}
