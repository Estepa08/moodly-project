import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PRACTICE_XP } from '@moodly/shared';
import { useRewardPractice, PracticeSource, useCreatureState } from '../features/gamification';
import { useParameters } from '../hooks/useParameters';
import { useEntries, useCreateEntry, useDeleteEntry } from '../hooks/useEntries';
import { RatingScaleSelector, DistortionTagsSelector } from '../features/mood-entry';
import { RATING_LEVELS, levelForValue } from '../lib/ratingLevels';
import { ParameterName } from '../lib/constants';
import { suggestDistortion } from '../lib/distortionKeywordHints';
import { DISTORTION_KEYS, DistortionKey } from '../lib/distortionsQuiz';
import { findLatestReframe } from '../lib/reframeLibrary';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Slider } from '../components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { IconButton } from '../components/ui/icon-button';
import {
  Flame,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Trash2,
  Sparkles,
  Quote,
} from 'lucide-react';
import EmptyState from '../components/ui/empty-state';
import { LoadingCard } from '../components/ui/loading-card';

const PARAM_NAME = 'Mood';
const MOOD_LEVELS = RATING_LEVELS[ParameterName.Mood]!;

interface BeliefSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  colorVar: '--accent' | '--primary';
}

function BeliefSlider({ label, value, onChange, colorVar }: BeliefSliderProps) {
  const color = `hsl(var(${colorVar}))`;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="text-center">
        <span className="text-3xl font-bold font-serif" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-muted-foreground">/10</span>
      </div>
      <Slider
        aria-label={label}
        min={0}
        max={10}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        style={{ '--slider-fill': color } as React.CSSProperties}
      />
    </div>
  );
}

export default function ThoughtJournalPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { data: params } = useParameters();
  const rewardPractice = useRewardPractice();
  const { data: creature } = useCreatureState();

  const moodParam = useMemo(() => params?.find((p) => p.name === PARAM_NAME), [params]);
  const { data: entries, isLoading: entriesLoading } = useEntries(
    moodParam ? { parameterId: moodParam.id } : undefined,
  );

  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [value, setValue] = useState(5);
  const [alternative, setAlternative] = useState('');
  const [distortions, setDistortions] = useState<DistortionKey[]>([]);
  const [beliefBefore, setBeliefBefore] = useState(7);
  const [beliefAfter, setBeliefAfter] = useState(4);
  const [streak, setStreak] = useState(0);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [lastResult, setLastResult] = useState<{ before: number; after: number } | null>(null);

  const activeDistortionKey = useMemo<DistortionKey | null>(
    () => distortions[0] ?? suggestDistortion(thought),
    [distortions, thought],
  );

  const pastReframe = useMemo(() => {
    if (!activeDistortionKey || !entries) return null;
    return findLatestReframe(entries, activeDistortionKey);
  }, [activeDistortionKey, entries]);

  // Реальная награда зависит от глубины цикла — кнопка и тост должны
  // показывать точную сумму, а не всегда «базовые» +5 XP.
  const willBeFullCycle =
    thought.trim().length > 0 && alternative.trim().length > 0 && distortions.length > 0;
  const nextXp = PRACTICE_XP[willBeFullCycle ? 'thoughtJournalCycle' : 'thoughtJournal'];

  useEffect(() => {
    if (creature) {
      setStreak(creature.streak ?? 0);
    }
  }, [creature]);

  // Приход по CTA со статистики («вот твоя самая частая ловушка») —
  // предзаполняем тег один раз при открытии страницы.
  useEffect(() => {
    const key = searchParams.get('distortion');
    if (key && (DISTORTION_KEYS as string[]).includes(key)) {
      setDistortions([key as DistortionKey]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Полный цикл (тег + вера-до + альтернатива + вера-после) награждается
  // отдельным источником с большим XP — награда идёт за завершённую работу
  // с мыслью, а не за факт записи в дневник.
  const isFullCycleRef = useRef(false);

  const createEntry = useCreateEntry(() => {
    const source = isFullCycleRef.current
      ? PracticeSource.ThoughtJournalCycle
      : PracticeSource.ThoughtJournal;
    rewardPractice.mutate(source, {
      onSuccess: (data) => {
        if (data?.state?.streak !== undefined) {
          setStreak(data.state.streak);
        }
      },
    });
  });

  const deleteEntry = useDeleteEntry();

  // Начало новой записи прячет карточку результата предыдущего цикла —
  // иначе старая дельта веры остаётся на экране, пока пишется следующая мысль.
  const clearStaleResult = () => {
    if (lastResult) setLastResult(null);
  };

  const buildNote = () => {
    const parts: string[] = [];
    if (situation.trim()) {
      parts.push(`${t('thoughtJournal.lblSituation')}\n${situation.trim()}`);
    }
    if (thought.trim()) {
      parts.push(`${t('thoughtJournal.lblThought')}\n${thought.trim()}`);
    }
    if (alternative.trim()) {
      parts.push(`${t('thoughtJournal.lblAlternative')}\n${alternative.trim()}`);
    }
    return parts.join('\n\n');
  };

  const handleSave = () => {
    if (!moodParam) return;
    const hasBeliefShift = thought.trim().length > 0 && alternative.trim().length > 0;
    const isFullCycle = hasBeliefShift && distortions.length > 0;
    isFullCycleRef.current = isFullCycle;
    const awardedXp = PRACTICE_XP[isFullCycle ? 'thoughtJournalCycle' : 'thoughtJournal'];
    createEntry.mutate(
      {
        parameterId: moodParam.id,
        value,
        note: buildNote() || undefined,
        distortions: distortions.length > 0 ? distortions : undefined,
        beliefBefore: hasBeliefShift ? beliefBefore : undefined,
        beliefAfter: hasBeliefShift ? beliefAfter : undefined,
        alternativeThought: alternative.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('thoughtJournal.saved', { xp: awardedXp }));
          setLastResult(hasBeliefShift ? { before: beliefBefore, after: beliefAfter } : null);
          setSituation('');
          setThought('');
          setAlternative('');
          setValue(5);
          setDistortions([]);
          setBeliefBefore(7);
          setBeliefAfter(4);
        },
      },
    );
  };

  const historyEntries = useMemo(() => {
    if (!entries) return [];
    return [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [entries]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('thoughtJournal.today');
    if (diffDays === 1) return t('thoughtJournal.yesterday');
    return d.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isLoading = !moodParam || (entriesLoading && !entries);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto">
        <LoadingCard />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t('thoughtJournal.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('thoughtJournal.subtitle')}</p>
        {streak > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-accent font-medium mt-2">
            <Flame aria-hidden="true" className="w-4 h-4" />
            <span>{t('thoughtJournal.streak', { count: streak })}</span>
          </div>
        )}
      </div>

      <Card className="shadow-neumorphic">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="tj-situation" className="text-sm font-medium text-foreground">
              {t('thoughtJournal.lblSituation')}
            </label>
            <Textarea
              id="tj-situation"
              value={situation}
              onChange={(e) => {
                setSituation(e.target.value);
                clearStaleResult();
              }}
              placeholder={t('thoughtJournal.situationPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tj-thought" className="text-sm font-medium text-foreground">
              {t('thoughtJournal.lblThought')}
            </label>
            <Textarea
              id="tj-thought"
              value={thought}
              onChange={(e) => {
                setThought(e.target.value);
                clearStaleResult();
              }}
              placeholder={t('thoughtJournal.thoughtPlaceholder')}
              rows={3}
            />
          </div>

          {(thought.trim().length > 0 || distortions.length > 0) && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground">
                {t('cognitiveDistortions.tagsTitle')}
              </p>
              <DistortionTagsSelector
                value={distortions}
                onChange={setDistortions}
                noteText={thought}
              />
            </div>
          )}

          {thought.trim().length > 0 && (
            <BeliefSlider
              label={t('thoughtJournal.lblBeliefBefore')}
              value={beliefBefore}
              onChange={setBeliefBefore}
              colorVar="--accent"
            />
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t('thoughtJournal.lblFeel')}</p>
            <RatingScaleSelector
              levels={MOOD_LEVELS}
              value={value}
              onChange={setValue}
              disabled={createEntry.isPending}
              ariaLabel={t('thoughtJournal.lblFeel')}
              compact
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="tj-alternative" className="text-sm font-medium text-foreground">
                {t('thoughtJournal.lblAlternative')}
              </label>
              <span className="text-xs text-muted-foreground">
                {t('thoughtJournal.alternativeOptional')}
              </span>
            </div>
            {pastReframe && alternative.trim().length === 0 ? (
              <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <Quote aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                  {t('thoughtJournal.pastReframeLabel')}
                </p>
                <p className="text-xs italic text-foreground">«{pastReframe.alternativeThought}»</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto py-1.5"
                  onClick={() => setAlternative(pastReframe.alternativeThought)}
                >
                  {t('thoughtJournal.usePastReframe')}
                </Button>
              </div>
            ) : (
              activeDistortionKey && (
                <p className="flex items-start gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs text-foreground">
                  <Sparkles
                    aria-hidden="true"
                    className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary"
                  />
                  <span>
                    {t('distortions.letGo.hintQuestion', {
                      distortion: t(`cognitiveDistortions.${activeDistortionKey}`),
                    })}
                  </span>
                </p>
              )
            )}
            <Textarea
              id="tj-alternative"
              value={alternative}
              onChange={(e) => {
                setAlternative(e.target.value);
                clearStaleResult();
              }}
              placeholder={t('thoughtJournal.alternativePlaceholder')}
              rows={3}
            />
          </div>

          {alternative.trim().length > 0 && (
            <BeliefSlider
              label={t('thoughtJournal.lblBeliefAfter')}
              value={beliefAfter}
              onChange={setBeliefAfter}
              colorVar="--primary"
            />
          )}

          <div className="space-y-1.5">
            <Button onClick={handleSave} disabled={createEntry.isPending} className="w-full">
              {t('thoughtJournal.save', { xp: nextXp })}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t('thoughtJournal.saveHint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {lastResult && (
        <Card className="shadow-neumorphic border-t-2 border-t-accent animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">{t('thoughtJournal.resultTitle')}</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl text-muted-foreground line-through decoration-border">
                {lastResult.before}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-4xl font-bold font-serif text-primary">{lastResult.after}</span>
            </div>
            {lastResult.after < lastResult.before ? (
              <span className="inline-flex rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                {t('thoughtJournal.resultDropBadge', {
                  delta: lastResult.before - lastResult.after,
                })}
              </span>
            ) : lastResult.after === lastResult.before ? (
              <p className="text-xs text-muted-foreground">{t('thoughtJournal.resultSameNote')}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{t('thoughtJournal.resultUpNote')}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-neumorphic">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList aria-hidden="true" className="w-4 h-4 text-primary" />
            {t('thoughtJournal.historyTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyEntries.length > 0 ? (
            <div className="space-y-2">
              {(showAllHistory ? historyEntries : historyEntries.slice(0, 3)).map((e) => {
                const level = levelForValue(MOOD_LEVELS, e.value);
                const Icon = level.Icon;
                return (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-card shadow-neumorphic-sm"
                  >
                    <span className="w-6 h-6 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <Icon
                        aria-hidden="true"
                        className={`w-5 h-5 ${
                          e.value >= 7.5
                            ? 'text-accent'
                            : e.value >= 5
                              ? 'text-primary'
                              : 'text-destructive/70'
                        }`}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</p>
                      {e.note ? (
                        <p className="text-sm text-foreground whitespace-pre-line line-clamp-3">
                          {e.note}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {t('thoughtJournal.noNote')}
                        </p>
                      )}
                    </div>
                    <IconButton
                      variant="ghost"
                      size="icon-sm"
                      label={t('thoughtJournal.deleteEntry')}
                      onClick={() => deleteEntry.mutate(e.id)}
                      disabled={deleteEntry.isPending}
                      className="text-muted-foreground shrink-0 hover:text-destructive"
                    >
                      <Trash2 aria-hidden="true" className="w-4 h-4" />
                    </IconButton>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={ClipboardList} title={t('thoughtJournal.noEntries')} />
          )}
          {historyEntries.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllHistory((s) => !s)}
              aria-expanded={showAllHistory}
              className="mt-3 flex items-center justify-center gap-1 w-full py-2 rounded-lg bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showAllHistory
                ? t('thoughtJournal.hideAll')
                : t('thoughtJournal.showAll', { count: historyEntries.length })}
              {showAllHistory ? (
                <ChevronUp aria-hidden="true" className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown aria-hidden="true" className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
