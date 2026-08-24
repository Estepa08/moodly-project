import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'moodly_install_prompt_dismissed_at';
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallPlatform = 'android' | 'ios';

function readDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? Number(raw) : null;
  } catch {
    /* localStorage may throw in private browsing */
    return null;
  }
}

function writeDismissedAt() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* localStorage may throw in private browsing */
  }
}

function isStandalone(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

// Предлагает установить PWA на домашний экран: на Android/Chrome — через
// нативный beforeinstallprompt, на iOS Safari (где такого API нет) —
// инструкцией «Поделиться → На экран «Домой»». После установки или отказа
// не показываем повторно в течение DISMISS_COOLDOWN_MS.
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => typeof window !== 'undefined' && isStandalone());
  const [dismissedAt, setDismissedAt] = useState(readDismissedAt);

  useEffect(() => {
    if (installed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [installed]);

  const platform: InstallPlatform | null = deferredEvent ? 'android' : isIosSafari() ? 'ios' : null;
  const recentlyDismissed = dismissedAt !== null && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  const canShow = !installed && !recentlyDismissed && platform !== null;

  const dismiss = useCallback(() => {
    writeDismissedAt();
    setDismissedAt(Date.now());
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;
    setDeferredEvent(null);
    if (choice.outcome === 'accepted') {
      setInstalled(true);
    } else {
      dismiss();
    }
  }, [deferredEvent, dismiss]);

  return { canShow, platform, promptInstall, dismiss };
}
