import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useCreatureState, useRewardPractice, PracticeSource } from '../gamification';
import { Button } from '../../components/ui/button';
import { LoadingCard } from '../../components/ui/loading-card';
import BossHealthBar from './BossHealthBar';
import StepDistortion from './StepDistortion';
import StepEvidence from './StepEvidence';
import StepWeigh from './StepWeigh';
import StepReframe from './StepReframe';
import { DistortionKey } from '../../lib/distortionsQuiz';
import { pickBoss, pickDistractors, type Boss } from './thoughtBattleContent';

type Step = 1 | 2 | 3 | 4 | 'victory';

interface RoundContent {
  boss: Boss;
  bossText: string;
  distractors: DistortionKey[];
}

export default function ThoughtBattleGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoading: creatureLoading } = useCreatureState();

  const rewardPractice = useRewardPractice();

  const [round, setRound] = useState(0);
  const [step, setStep] = useState<Step>(1);
  const [hp, setHp] = useState(100);
  const [hitSignal, setHitSignal] = useState(0);
  const [reframeChosen, setReframeChosen] = useState('');

  const content: RoundContent = useMemo(() => {
    const boss = pickBoss();
    const bossText = t(`thoughtBattle.bosses.${boss.key}`);
    const distractors = pickDistractors(boss.distortionKey, 3);
    return { boss, bossText, distractors };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  if (creatureLoading) return <LoadingCard />;

  const hit = (amount: number) => {
    setHp((h) => Math.max(0, h - amount));
    setHitSignal((s) => s + 1);
  };

  const handleDistortionCorrect = () => {
    hit(25);
    setStep(2);
  };

  const handleEvidenceComplete = () => {
    setStep(3);
  };

  const handleWeighComplete = () => {
    setStep(4);
  };

  const handleReframeComplete = (chosen: string) => {
    setReframeChosen(chosen);
    setHp(0);
    setHitSignal((s) => s + 1);
    setStep('victory');
    rewardPractice.mutate(PracticeSource.ThoughtBattle);
  };

  const playAgain = () => {
    setRound((r) => r + 1);
    setStep(1);
    setHp(100);
    setReframeChosen('');
  };

  const distortionKey = content.boss.distortionKey;
  const distortionContent = t(`thoughtBattle.content.${distortionKey}`, {
    returnObjects: true,
  }) as unknown as {
    evidence: { text: string; isFact: boolean }[];
    gives: string[];
    costs: string[];
    reframeOptions: string[];
  };

  if (step === 'victory') {
    return (
      <div className="rounded-2xl bg-card shadow-neumorphic p-6 space-y-4 text-center relative overflow-hidden">
        <Sparkles
          aria-hidden="true"
          className="w-8 h-8 text-warning mx-auto animate-evolution-confetti"
        />
        <p className="text-base font-bold text-foreground">{t('thoughtBattle.victoryTitle')}</p>
        <div className="rounded-xl bg-muted/50 p-3 text-left space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {t('thoughtBattle.wasLabel')}
          </p>
          <p className="text-sm text-muted-foreground line-through decoration-destructive/40">
            {content.bossText}
          </p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-left space-y-1">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {t('thoughtBattle.becameLabel')}
          </p>
          <p className="text-sm font-semibold text-foreground">{reframeChosen}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="default" onClick={playAgain} className="w-full">
            {t('thoughtBattle.playAgainCta')}
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </Button>
          <Button variant="secondary" onClick={() => navigate('/my-day')} className="w-full">
            {t('thoughtBattle.backCta')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-neumorphic p-5 space-y-4">
      <BossHealthBar percent={hp} hitSignal={hitSignal} />

      <div className="rounded-xl bg-muted/40 p-3 space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {t('thoughtBattle.sourceLibrary')}
        </p>
        <p className="text-sm font-semibold text-foreground italic">«{content.bossText}»</p>
      </div>

      {step === 1 && (
        <StepDistortion
          correct={distortionKey}
          distractors={content.distractors}
          onCorrect={handleDistortionCorrect}
        />
      )}
      {step === 2 && (
        <StepEvidence
          items={distortionContent.evidence}
          onHit={() => hit(10)}
          onComplete={handleEvidenceComplete}
        />
      )}
      {step === 3 && (
        <StepWeigh
          gives={distortionContent.gives}
          costs={distortionContent.costs}
          onComplete={handleWeighComplete}
        />
      )}
      {step === 4 && (
        <StepReframe
          options={distortionContent.reframeOptions}
          onComplete={handleReframeComplete}
        />
      )}
    </div>
  );
}
