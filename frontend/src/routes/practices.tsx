import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { useStalePractices } from '../hooks/useStalePractices';
import { useTests } from '../hooks/useTests';
import {
  Wind,
  Heart,
  BrainCircuit,
  Moon,
  Scale,
  BookOpen,
  Clock,
  ClipboardList,
  FlaskConical,
  Shuffle,
  Swords,
  PieChart,
  AlertTriangle,
} from 'lucide-react';
import { PATH_TO_SOURCE } from '../lib/practicePaths';

type GroupKey = 'mindWork' | 'emotions' | 'body' | 'habits' | 'positivePsychology';

const PRACTICE_GROUPS: { key: GroupKey; labelKey: string }[] = [
  { key: 'mindWork', labelKey: 'practices.groupMindWork' },
  { key: 'emotions', labelKey: 'practices.groupEmotions' },
  { key: 'body', labelKey: 'practices.groupBody' },
  { key: 'habits', labelKey: 'practices.groupHabits' },
  { key: 'positivePsychology', labelKey: 'practices.groupPositivePsychology' },
];

const PRACTICES = [
  {
    path: '/practices/thought-journal',
    icon: BookOpen,
    labelKey: 'nav.thoughtJournal',
    descKey: 'practices.descThoughtJournal',
    timeKey: 'practices.timeThoughtJournal',
    groupKey: 'mindWork' as GroupKey,
  },
  {
    path: '/practices/distortions',
    icon: BrainCircuit,
    labelKey: 'nav.distortions',
    descKey: 'practices.descDistortions',
    timeKey: 'practices.timeDistortions',
    groupKey: 'mindWork' as GroupKey,
  },
  {
    path: '/practices/cost-benefit-analysis',
    icon: Scale,
    labelKey: 'nav.cba',
    descKey: 'practices.descCba',
    timeKey: 'practices.timeCba',
    groupKey: 'mindWork' as GroupKey,
  },
  {
    path: '/practices/thought-battle',
    icon: Swords,
    labelKey: 'nav.thoughtBattle',
    descKey: 'practices.descThoughtBattle',
    timeKey: 'practices.timeThoughtBattle',
    groupKey: 'mindWork' as GroupKey,
  },
  {
    path: '/practices/responsibility-pie',
    icon: PieChart,
    labelKey: 'nav.responsibilityPie',
    descKey: 'practices.descResponsibilityPie',
    timeKey: 'practices.timeResponsibilityPie',
    groupKey: 'mindWork' as GroupKey,
  },
  {
    path: '/practices/decatastrophizing',
    icon: AlertTriangle,
    labelKey: 'nav.decatastrophizing',
    descKey: 'practices.descDecatastrophizing',
    timeKey: 'practices.timeDecatastrophizing',
    groupKey: 'mindWork' as GroupKey,
  },
  {
    path: '/practices/emotion-lab',
    icon: FlaskConical,
    labelKey: 'nav.emotionLab',
    descKey: 'practices.descEmotionLab',
    timeKey: 'practices.timeEmotionLab',
    groupKey: 'emotions' as GroupKey,
  },
  {
    path: '/practices/sleep-hygiene',
    icon: Moon,
    labelKey: 'nav.sleepHygiene',
    descKey: 'practices.descSleepHygiene',
    timeKey: 'practices.timeSleepHygiene',
    groupKey: 'body' as GroupKey,
  },
  {
    path: '/practices/breathing',
    icon: Wind,
    labelKey: 'nav.breathing',
    descKey: 'practices.descBreathing',
    timeKey: 'practices.timeBreathing',
    groupKey: 'body' as GroupKey,
  },
  {
    path: '/practices/relaxation-wheel',
    icon: Shuffle,
    labelKey: 'nav.relaxationWheel',
    descKey: 'practices.descRelaxationWheel',
    timeKey: 'practices.timeRelaxationWheel',
    groupKey: 'body' as GroupKey,
  },
  {
    path: '/practices/gratitude',
    icon: Heart,
    labelKey: 'nav.gratitude',
    descKey: 'practices.descGratitude',
    timeKey: 'practices.timeGratitude',
    groupKey: 'positivePsychology' as GroupKey,
  },
];

export default function PracticesPage() {
  const { t } = useTranslation();
  const { isStale } = useStalePractices(3);
  const { data: tests, isLoading: testsLoading } = useTests();
  const detailedTests = useQueries({
    queries: (tests ?? []).map((test) => ({
      queryKey: ['test', test.id],
      queryFn: () => api.tests.get(test.id),
      staleTime: 60_000,
    })),
  });
  const testsWithQuestions = tests?.map((test, i) => ({
    ...test,
    questions: detailedTests[i]?.data?.questions ?? [],
  }));

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground font-serif">{t('nav.practices')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('practices.subtitle')}</p>
      </div>

      <div className="space-y-5">
        {PRACTICE_GROUPS.map((group) => {
          const items = PRACTICES.filter((p) => p.groupKey === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className="space-y-2">
              <h3 className="text-base font-semibold text-foreground font-serif">
                {t(group.labelKey)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((p) => {
                  const Icon = p.icon;
                  const source = PATH_TO_SOURCE[p.path];
                  const stale = source ? isStale(source) : false;
                  return (
                    <Link key={p.path} to={p.path} className="block">
                      <Card
                        className={`shadow-elevation-2 hover:shadow-elevation-3 transition-[box-shadow] duration-150 ${stale ? 'border-l-2 border-primary' : ''}`}
                      >
                        <CardContent className="flex items-start gap-4 p-5">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-elevation-inset ${stale ? 'bg-primary/20' : 'bg-primary/10'}`}
                          >
                            <Icon aria-hidden="true" className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{t(p.labelKey)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t(p.descKey)}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                              <Clock aria-hidden="true" className="w-3 h-3" />
                              {t(p.timeKey)}
                            </p>
                            {stale && (
                              <p className="text-xs text-primary mt-1">
                                {t('practices.staleLabel')}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 space-y-2">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground font-serif">
            {t('practices.testsSection')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('practices.testsSubtitle')}</p>
        </div>

        {testsLoading ? (
          <div className="h-32 rounded-xl bg-muted/40 animate-pulse" aria-hidden="true" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {testsWithQuestions?.map((test) => (
              <Link key={test.id} to={`/tests/${test.id}`} className="block">
                <Card className="shadow-elevation-2 hover:shadow-elevation-3 transition-[box-shadow] duration-150 border-l-2 border-l-accent">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-accent/10">
                      <ClipboardList aria-hidden="true" className="w-6 h-6 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-accent/10 text-[10px] font-medium text-accent mb-1.5 uppercase tracking-wide">
                        {t('practices.testCategory')}
                      </span>
                      <p className="text-sm font-semibold text-foreground">{test.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{test.description}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                        <Clock aria-hidden="true" className="w-3 h-3" />
                        {t('practices.testQuestions', { count: test.questions.length })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
