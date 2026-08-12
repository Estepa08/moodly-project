import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLoginForm } from '../hooks/useLoginForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Label } from '../components/ui/label';
import { ShieldCheck, KeyRound, Info } from 'lucide-react';
import { AuthPage, AuthHeader, AuthDisclaimer } from '../features/auth';
import { useSeo, withCanonical } from '../lib/seo';

export default function LoginPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useSeo({
    title: t('login.seo.title'),
    description: t('login.seo.description'),
    canonical: withCanonical('/login'),
  });

  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    unlockRequired,
    demoMode,
    demoLoading,
    step,
    recoveryCode,
    handleSubmit,
    handleDemo,
    handleRecoveryConfirmed,
  } = useLoginForm();

  if (step === 'recovery') {
    return (
      <AuthPage>
        <AuthHeader title={t('register.recoveryTitle')} />
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{t('login.legacyIntro')}</p>
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound aria-hidden="true" className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {t('register.recoveryLabel')}
              </span>
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('login.legacyRecoveryNote')}
          </p>
          <Button className="w-full" onClick={handleRecoveryConfirmed}>
            {t('register.recoveryConfirmed')}
          </Button>
        </div>
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthHeader title={t('login.title')} subtitle={t('login.tagline')} />

      {unlockRequired && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100 space-y-1.5"
        >
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck aria-hidden="true" className="w-4 h-4 shrink-0" />
            <span>{t('login.unlockReasonTitle')}</span>
          </div>
          <p className="leading-relaxed">{t('login.unlockReason')}</p>
          <p className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-200">
            <Info aria-hidden="true" className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t('login.unlockReasonHint')}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('login.email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            required
            autoFocus={!isMobile}
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('login.password')}</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="go"
            required
            showLabel={t('common.showPassword')}
            hideLabel={t('common.hidePassword')}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full">
          {t('login.signIn')}
        </Button>

        {demoMode && (
          <>
            <div className="flex items-center gap-2">
              <span className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{t('login.or')}</span>
              <span className="flex-1 h-px bg-border" />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={demoLoading}
              onClick={handleDemo}
            >
              {demoLoading ? t('login.starting') : t('login.quickDemo')}
            </Button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            {t('login.signUp')}
          </Link>
        </p>
      </form>

      <AuthDisclaimer />
    </AuthPage>
  );
}
