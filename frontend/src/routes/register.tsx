import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useIsMobile } from '../hooks/useIsMobile';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Label } from '../components/ui/label';
import { AuthPage, AuthHeader, AuthDisclaimer } from '../features/auth';
import RecoveryCodeReveal from '../components/RecoveryCodeReveal';
import { useSeo, withCanonical } from '../lib/seo';

export default function RegisterPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useSeo({
    title: t('register.seo.title'),
    description: t('register.seo.description'),
    canonical: withCanonical('/register'),
    noindex: true,
  });

  const {
    step,
    email,
    setEmail,
    password,
    setPassword,
    birthYear,
    setBirthYear,
    ageConfirmed,
    setAgeConfirmed,
    pdpConsent,
    setPdpConsent,
    error,
    handleSubmit,
    recoveryCode,
    handleRecoveryConfirmed,
  } = useRegisterForm();

  if (step === 'recovery') {
    return (
      <AuthPage>
        <AuthHeader title={t('register.recoveryTitle')} />
        <RecoveryCodeReveal
          recoveryCode={recoveryCode}
          intro={t('register.recoveryIntro')}
          onConfirm={handleRecoveryConfirmed}
        />
      </AuthPage>
    );
  }

  return (
    <AuthPage>
      <AuthHeader title={t('register.title')} subtitle={t('register.subtitle')} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="regEmail">{t('register.email')}</Label>
          <Input
            id="regEmail"
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
          <Label htmlFor="regPassword">{t('register.password')}</Label>
          <PasswordInput
            id="regPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            enterKeyHint="next"
            required
            showLabel={t('common.showPassword')}
            hideLabel={t('common.hidePassword')}
          />
          <p className="text-xs text-muted-foreground">{t('register.passwordHint')}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="regBirthYear">{t('register.birthYear')}</Label>
          <Input
            id="regBirthYear"
            type="text"
            inputMode="numeric"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            autoComplete="bday-year"
            enterKeyHint="next"
            placeholder={t('register.birthYearPlaceholder')}
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-start gap-2 text-sm cursor-pointer">
            <span className="relative -m-3.5 shrink-0 p-3.5">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="block h-4 w-4"
                required
              />
            </span>
            <span>
              {t('register.ageConsentText')}{' '}
              <Link to="/terms" className="text-primary hover:underline">
                {t('register.termsLink')}
              </Link>{' '}
              {t('register.and')}{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                {t('register.privacyLink')}
              </Link>
            </span>
          </Label>
          <Label className="flex items-start gap-2 text-sm cursor-pointer">
            <span className="relative -m-3.5 shrink-0 p-3.5">
              <input
                type="checkbox"
                checked={pdpConsent}
                onChange={(e) => setPdpConsent(e.target.checked)}
                className="block h-4 w-4"
                required
              />
            </span>
            <span>
              {t('register.pdpConsentText')}{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                {t('register.pdpConsentLink')}
              </Link>
            </span>
          </Label>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
          {t('register.e2eNote')}
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={!ageConfirmed || !pdpConsent}>
          {t('register.signUp')}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            {t('register.signIn')}
          </Link>
        </p>
      </form>

      <AuthDisclaimer />
    </AuthPage>
  );
}
