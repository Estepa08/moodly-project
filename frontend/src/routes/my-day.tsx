import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sunrise, Sunset, SunMedium, CheckCircle2, CalendarRange, Moon } from 'lucide-react';
import { useDayPhase } from '../hooks/useDayPhase';
import { useEntries } from '../hooks/useEntries';
import { useParameters } from '../hooks/useParameters';
import { useSleepHygieneEntry } from '../hooks/useSleepHygieneEntry';
import PetGreeterCard from '../features/gamification/PetGreeterCard';
import { DailyMotivationCard } from '../features/dailyCard';
import PetCheckInDialog, {
  shouldAutoOpenCheckIn,
  markCheckInDone,
} from '../features/check-in/PetCheckInDialog';
import DayActivitiesCard from '../features/check-in/DayActivitiesCard';
import DayActivitiesSection from '../features/check-in/DayActivitiesSection';
import SleepHygieneChecklist from '../features/check-in/SleepHygieneChecklist';
import ActivityCorrelationCard from '../features/analytics/ActivityCorrelationCard';
import { ModalShell } from '../components/ui/modal-shell';
import { ComponentSize, ParameterName } from '../lib/constants';

function useTodayParamIds() {
  const { data: params } = useParameters();
  const paramIdByName = useMemo(() => new Map((params ?? []).map((p) => [p.name, p.id])), [params]);

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start.toISOString(), to: end.toISOString() };
  }, []);

  const { data: todayEntries } = useEntries(todayRange);

  const savedTodayParamIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of todayEntries ?? []) ids.add(e.parameterId);
    return ids;
  }, [todayEntries]);

  return { paramIdByName, savedTodayParamIds };
}

function PhaseHeader() {
  const { t } = useTranslation();
  const phase = useDayPhase();

  if (phase === 'morning') {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Sunrise aria-hidden="true" className="w-4 h-4 text-accent" />
        {t('myDay.morningHint')}
      </p>
    );
  }
  if (phase === 'evening') {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Sunset aria-hidden="true" className="w-4 h-4 text-accent" />
        {t('myDay.eveningHint')}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <SunMedium aria-hidden="true" className="w-4 h-4 text-accent" />
      {t('myDay.dayHint')}
    </p>
  );
}

function MorningStatus() {
  const { t } = useTranslation();
  const { paramIdByName, savedTodayParamIds } = useTodayParamIds();

  const coreParams = ['Mood', 'Energy', 'Sleep', 'Anxiety'];
  const filled = coreParams.filter((name) => {
    const id = paramIdByName.get(name);
    return id && savedTodayParamIds.has(id);
  });

  if (filled.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-success/10 text-success px-3 py-2.5">
      <CheckCircle2 aria-hidden="true" className="w-4 h-4 shrink-0" />
      <p className="text-xs font-medium">
        {t('myDay.morningDone', { count: filled.length, total: coreParams.length })}
      </p>
    </div>
  );
}

export default function MyDay() {
  const { t } = useTranslation();
  const phase = useDayPhase();
  const { paramIdByName, savedTodayParamIds } = useTodayParamIds();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [activitiesModalOpen, setActivitiesModalOpen] = useState(false);
  const [sleepHygieneModalOpen, setSleepHygieneModalOpen] = useState(false);
  const markActivitiesRef = useRef<HTMLDivElement>(null);
  const sleepHygiene = useSleepHygieneEntry();

  useEffect(() => {
    const autoOpen = shouldAutoOpenCheckIn(savedTodayParamIds, paramIdByName);
    if (!autoOpen) return;
    const timer = setTimeout(() => setCheckInOpen(true), 500);
    return () => clearTimeout(timer);
  }, [paramIdByName, savedTodayParamIds]);

  const handleCheckInClose = (open: boolean) => {
    setCheckInOpen(open);
    if (!open) markCheckInDone();
  };

  const scrollToActivities = () => {
    markActivitiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const showMorningStatus = phase === 'day';

  const activitiesParamId = paramIdByName.get(ParameterName.DayActivities);
  const activitiesLoggedToday = activitiesParamId
    ? savedTodayParamIds.has(activitiesParamId)
    : false;
  const sleepHygieneParamId = paramIdByName.get(ParameterName.SleepHygiene);
  const sleepHygieneLoggedToday = sleepHygieneParamId
    ? savedTodayParamIds.has(sleepHygieneParamId)
    : false;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">{t('nav.myDay')}</h1>
        <PhaseHeader />
      </div>

      <PetGreeterCard onCheckIn={() => setCheckInOpen(true)} />

      <DailyMotivationCard />

      {showMorningStatus && <MorningStatus />}

      <div ref={markActivitiesRef}>
        <DayActivitiesCard />
      </div>

      <ActivityCorrelationCard />

      <PetCheckInDialog
        open={checkInOpen}
        onOpenChange={handleCheckInClose}
        onMarkActivities={scrollToActivities}
        onOpenActivities={() => setActivitiesModalOpen(true)}
        onOpenSleepHygiene={() => setSleepHygieneModalOpen(true)}
        activitiesLoggedToday={activitiesLoggedToday}
        sleepHygieneLoggedToday={sleepHygieneLoggedToday}
      />

      <ModalShell
        open={activitiesModalOpen}
        onOpenChange={setActivitiesModalOpen}
        icon={CalendarRange}
        iconSize={ComponentSize.Md}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        title={t('dayActivities.sectionHeading')}
        description={t('dayActivities.subtitle')}
      >
        <DayActivitiesSection onClose={() => setActivitiesModalOpen(false)} />
      </ModalShell>

      <ModalShell
        open={sleepHygieneModalOpen}
        onOpenChange={setSleepHygieneModalOpen}
        icon={Moon}
        iconSize={ComponentSize.Md}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        title={t('sleepHygiene.title')}
        description={t('sleepHygiene.subtitle')}
      >
        <SleepHygieneChecklist
          parameterId={sleepHygiene.parameterId}
          hygieneEntries={sleepHygiene.hygieneEntries}
          createEntry={sleepHygiene.createEntry}
          updateEntry={sleepHygiene.updateEntry}
        />
      </ModalShell>
    </div>
  );
}
