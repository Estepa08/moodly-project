import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ProgressBar } from '../../components/ui/progress-bar';
import Spinner from '../../components/ui/spinner';
import { useRewardPractice, PracticeSource } from '../gamification';
import EmotionWheel from './EmotionWheel';
import EmotionResult from './EmotionResult';
import EmotionJournal from './EmotionJournal';
import EmotionLimit from './EmotionLimit';
import {
  useEmotionLabState,
  useEmotionLabAttempt,
  type EmotionLabAttemptResponse,
} from './useEmotionLab';

export default function EmotionLabScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<EmotionLabAttemptResponse | null>(null);

  const { data: state, isLoading, isError, error } = useEmotionLabState();
  const rewardPractice = useRewardPractice();
  const attempt = useEmotionLabAttempt();

  const toggleEmotion = (key: string) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 2) return [prev[1], key];
      return [...prev, key];
    });
  };

  const handleMix = () => {
    if (selected.length !== 2 || attempt.isPending) return;

    const [emotionA, emotionB] = selected;
    attempt.mutate(
      { emotionA, emotionB },
      {
        onSuccess: (data: EmotionLabAttemptResponse) => {
          setResult(data);
          setSelected([]);
          if (data.isNewDiscovery) {
            rewardPractice.mutate(PracticeSource.EmotionLab);
          }
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !state) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        {t('emotionLab.loadError')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">
          {t('emotionLab.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('emotionLab.subtitle')}</p>
        <a
          href="https://www.americanscientist.org/article/the-nature-of-emotions"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1.5 text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
        >
          {t('emotionLab.plutchikCredit')}
        </a>
      </div>

      {/* Попытки на сегодня */}
      <Card className="shadow-elevation-2">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">{t('emotionLab.attemptsTitle')}</p>
            <p className="text-sm font-bold text-primary">
              {state.attemptsUsed} {t('emotionLab.of')} {state.dailyLimit}
            </p>
          </div>
          <ProgressBar
            height={2}
            rounded
            segments={[
              {
                value: state.dailyLimit > 0 ? (state.attemptsUsed / state.dailyLimit) * 100 : 0,
                className: 'bg-primary',
              },
            ]}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Результат последней попытки */}
      {result && (
        <div className={cn('animate-in fade-in slide-in-from-bottom-2 duration-300')}>
          <EmotionResult result={result} />
        </div>
      )}

      {/* Лимит достигнут */}
      {state.limitReached ? (
        <EmotionLimit tier={state.tier} dailyLimit={state.dailyLimit} resetsAt={state.resetsAt} />
      ) : (
        <Card className="shadow-elevation-2">
          <CardContent className="p-5">
            <EmotionWheel selected={selected} onSelect={toggleEmotion} />
            <p className="text-center text-xs text-muted-foreground mt-4">
              {t('emotionLab.pickHint')}
            </p>

            <div className="mt-4 flex items-center justify-center gap-3">
              {selected.length === 0 ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FlaskConical aria-hidden="true" className="w-4 h-4" />
                  {t('emotionLab.mixPlaceholder')}
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium text-foreground">
                    {t('emotionLab.mixReady')}
                  </span>
                  <Button
                    onClick={handleMix}
                    disabled={selected.length !== 2 || attempt.isPending}
                    size="lg"
                  >
                    {attempt.isPending ? t('emotionLab.mixing') : t('emotionLab.mix')}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Журнал открытий */}
      <Card className="shadow-elevation-2">
        <CardContent className={cn('p-5')}>
          <EmotionJournal state={state} />
        </CardContent>
      </Card>
    </div>
  );
}
