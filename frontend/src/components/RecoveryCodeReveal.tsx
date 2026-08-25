import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from './ui/button';

interface RecoveryCodeRevealProps {
  recoveryCode: string;
  /** Вступительный абзац перед кодом — отличается между login (легаси-вход) и register. */
  intro: ReactNode;
  /** Доп. абзац после предупреждения, перед кнопкой подтверждения (используется только login-ом). */
  note?: ReactNode;
  onConfirm: () => void;
}

/**
 * Экран показа recovery-кода после входа/регистрации: код + предупреждение
 * «сохраните, второй раз не покажем» + подтверждение. Общий для login.tsx
 * (легаси-вход без DEK) и register.tsx (свежая регистрация).
 */
export default function RecoveryCodeReveal({
  recoveryCode,
  intro,
  note,
  onConfirm,
}: RecoveryCodeRevealProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">{intro}</p>
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound aria-hidden="true" className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{t('register.recoveryLabel')}</span>
        </div>
        <p className="font-mono text-lg tracking-wider break-all text-center select-all">
          {recoveryCode}
        </p>
      </div>
      <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck aria-hidden="true" className="w-4 h-4 shrink-0" />
          <span className="font-medium">{t('register.recoveryWarningTitle')}</span>
        </div>
        <p>{t('register.recoveryWarning')}</p>
      </div>
      {note && <p className="text-sm text-muted-foreground leading-relaxed">{note}</p>}
      <Button className="w-full" onClick={onConfirm}>
        {t('register.recoveryConfirmed')}
      </Button>
    </div>
  );
}
