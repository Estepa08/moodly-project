import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, X } from 'lucide-react';
import { Button } from '../components/ui/button';

const HINT_DISMISSED_KEY = 'moodly_dashboard_hint_dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(HINT_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissed() {
  try {
    localStorage.setItem(HINT_DISMISSED_KEY, '1');
  } catch {
    /* localStorage may be unavailable */
  }
}

interface FirstTimeHintProps {
  visible: boolean;
}

export default function FirstTimeHint({ visible }: FirstTimeHintProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!visible || dismissed) return null;

  return (
    <section
      aria-label={t('dashboard.firstTimeHint.title')}
      className="relative rounded-xl bg-primary/10 shadow-neumorphic-sm px-4 py-3 pr-11 flex items-start gap-3 animate-card-enter"
    >
      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <BarChart3 aria-hidden="true" className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {t('dashboard.firstTimeHint.title')}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {t('dashboard.firstTimeHint.description')}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => {
            persistDismissed();
            setDismissed(true);
          }}
        >
          {t('dashboard.firstTimeHint.dismiss')}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => {
          persistDismissed();
          setDismissed(true);
        }}
        aria-label={t('common.close')}
        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-[color,background-color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X aria-hidden="true" className="w-4 h-4" />
      </button>
    </section>
  );
}
