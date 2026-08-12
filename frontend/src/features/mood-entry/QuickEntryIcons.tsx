import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Sparkles, Check } from 'lucide-react';
import type { CreateEntryMutation } from '../../lib/app-types';
import type { components } from '../../lib/api-types';
import { reportError } from '../../lib/errorReporter';
import { PARAM_ICON_CONFIGS } from '../../lib/quickEntryIcons';
import { PARAM_ICONS } from '../../lib/constants';
import { ParameterName } from '../../lib/constants';
import { RATING_LEVELS, levelForValue } from '../../lib/ratingLevels';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { RatingScaleSelector } from './RatingScaleSelector';
import DistortionTagsSelector from './DistortionTagsSelector';
import { Button } from '../../components/ui/button';
import type { DistortionKey } from '../../lib/distortionsQuiz';

interface QuickEntryIconsProps {
  createEntry: CreateEntryMutation;
  numericParams: components['schemas']['Parameter'][] | undefined;
  savedTodayParamIds: Set<string>;
}

export default function QuickEntryIcons({
  createEntry,
  numericParams,
  savedTodayParamIds,
}: QuickEntryIconsProps) {
  const { t } = useTranslation();
  const [selectedParam, setSelectedParam] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(5);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [distortions, setDistortions] = useState<DistortionKey[]>([]);
  const noteInputRef = useRef<HTMLInputElement>(null);

  const configs = PARAM_ICON_CONFIGS.filter((cfg) =>
    numericParams?.some((p) => p.name === cfg.parameterName),
  );

  const paramIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of numericParams ?? []) map.set(p.name, p.id);
    return map;
  }, [numericParams]);

  const handleParamTap = useCallback((name: string) => {
    setSelectedParam((prev) => (prev === name ? null : name));
    setSliderValue(5);
    setShowNote(false);
    setNoteText('');
    setDistortions([]);
  }, []);

  const handleSave = useCallback(
    (parameterName: string, value: number) => {
      const param = numericParams?.find((p) => p.name === parameterName);
      if (!param) return;

      const payload: {
        parameterId: string;
        value: number;
        note?: string;
        distortions?: DistortionKey[];
      } = {
        parameterId: param.id,
        value,
      };

      if (noteText.trim()) {
        payload.note = noteText.trim();
      }

      if (distortions.length > 0) {
        payload.distortions = distortions;
      }

      createEntry.mutate(payload, {
        onSuccess: () => {
          toast.success(t('dashboard.quickEntry.entrySaved'));
          setSelectedParam(null);
          setShowNote(false);
          setNoteText('');
          setDistortions([]);
        },
        onError: (err) => {
          const message =
            err instanceof Error
              ? `saveError [quick-entry] ${err.name}: ${err.message}`
              : `saveError [quick-entry] Unexpected error: ${String(err)}`;
          reportError({ message, stack: err instanceof Error ? err.stack : undefined });
          toast.error(t('dashboard.quickEntry.saveError'));
        },
      });
    },
    [createEntry, numericParams, t, noteText, distortions],
  );

  return (
    <Card className="shadow-neumorphic border-l-4 border-l-accent">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 font-serif">
          <Sparkles aria-hidden="true" className="w-5 h-5 text-accent" />
          <span>{t('dashboard.quickEntry.title')}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground ml-7">{t('dashboard.quickEntry.subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {configs.map((cfg) => {
            const isActive = selectedParam === cfg.parameterName;
            const Icon = PARAM_ICONS[cfg.parameterName as ParameterName];
            const paramId = paramIdByName.get(cfg.parameterName);
            const isSaved = paramId ? savedTodayParamIds.has(paramId) : false;
            const label = t(cfg.labelKey);
            return (
              <button
                key={cfg.parameterName}
                onClick={() => handleParamTap(cfg.parameterName)}
                className={`relative flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl transition-[color,background-color,box-shadow,transform] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-neumorphic-sm scale-105'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5 hover:shadow-neumorphic-sm'
                }`}
                aria-label={
                  isSaved ? `${label} — ${t('dashboard.quickEntry.savedIndicator')}` : label
                }
                aria-pressed={isActive}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                  {Icon && (
                    <Icon aria-hidden="true" className="w-8 h-8 sm:w-9 sm:h-9 text-primary" />
                  )}
                </div>
                {isSaved && (
                  <span
                    data-testid={`quick-entry-saved-${cfg.parameterName}`}
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-accent-strong text-accent-foreground ring-2 ring-card"
                  >
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
                <span className="text-xs font-medium leading-tight text-center">{label}</span>
              </button>
            );
          })}
        </div>

        {selectedParam && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            {(() => {
              const cfg = configs.find((c) => c.parameterName === selectedParam);
              if (!cfg) return null;

              return (
                <div className="space-y-3">
                  {(() => {
                    const levels =
                      RATING_LEVELS[cfg.parameterName as ParameterName] ??
                      RATING_LEVELS[ParameterName.Mood]!;
                    const level = levelForValue(levels, sliderValue);
                    return (
                      <>
                        <div className="px-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold font-serif text-primary">
                              {t(level.labelKey)}
                            </span>
                          </div>
                          <RatingScaleSelector
                            levels={levels}
                            value={sliderValue}
                            onChange={setSliderValue}
                            disabled={createEntry.isPending}
                            ariaLabel={t(cfg.labelKey)}
                          />
                        </div>

                        <div className="flex justify-center">
                          <Button
                            onClick={() => handleSave(cfg.parameterName, sliderValue)}
                            disabled={createEntry.isPending}
                          >
                            {t('dashboard.quickEntry.save')}
                          </Button>
                        </div>
                      </>
                    );
                  })()}

                  <div className="flex items-center justify-center gap-2">
                    {!showNote ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setShowNote(true);
                          setTimeout(() => noteInputRef.current?.focus(), 100);
                        }}
                        className="h-auto px-2 min-h-[44px] text-xs text-muted-foreground hover:text-primary"
                        aria-label={t('dashboard.quickEntry.addNote')}
                      >
                        <Plus aria-hidden="true" className="w-3 h-3" />
                        {t('dashboard.quickEntry.addNote')}
                      </Button>
                    ) : (
                      <div className="space-y-3 w-full">
                        <div className="flex items-center gap-2">
                          <label className="sr-only" htmlFor="quick-entry-note">
                            {t('dashboard.quickEntry.notePlaceholder')}
                          </label>
                          <input
                            id="quick-entry-note"
                            ref={noteInputRef}
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder={t('dashboard.quickEntry.notePlaceholder')}
                            autoComplete="off"
                            enterKeyHint="done"
                            className="w-full md:w-40 text-sm bg-muted rounded-lg px-3 py-2 border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSave(cfg.parameterName, sliderValue);
                              }
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            {t('cognitiveDistortions.tagsTitle')}
                          </p>
                          <DistortionTagsSelector
                            value={distortions}
                            onChange={setDistortions}
                            noteText={noteText}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {createEntry.isPending && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
