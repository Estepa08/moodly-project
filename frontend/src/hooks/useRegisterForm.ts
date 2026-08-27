import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/error-messages';
import { useAuth } from './useAuth';
import { createRegistrationKeys } from '../lib/crypto/auth-keys';
import { generateRecoveryCode } from '../lib/crypto/keys';
import { setSessionUserId } from '../lib/crypto/session';
import { getStoredReferralCode } from '../lib/referral';
import { trackGoal } from '../lib/metrika';

export type RegisterStep = 'form' | 'recovery';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function useRegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<RegisterStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [pdpConsent, setPdpConsent] = useState(false);
  const [error, setError] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const currentYear = new Date().getFullYear();
  const birthYearNum = birthYear ? Number(birthYear) : null;
  const isAdult = birthYearNum != null && currentYear - birthYearNum >= 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_PATTERN.test(email)) {
      setError(t('register.emailError'));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('register.passwordError'));
      return;
    }
    if (!isAdult) {
      setError(t('register.ageError'));
      return;
    }
    try {
      const code = generateRecoveryCode();
      const keys = await createRegistrationKeys(password, code);
      // Инвайт-механика (Сессия 8): код сохранён на лендинге в sessionStorage
      // (captureReferralCode), если пользователь пришёл по реферальной
      // ссылке — здесь просто читаем и пробрасываем как есть, без валидации
      // против списка реальных пользователей (backend его нигде не смотрит,
      // только логирует).
      const referralCode = getStoredReferralCode() ?? undefined;
      const res = await api.auth.register({
        email,
        password,
        ageConfirmed,
        pdpConsent,
        birthYear: birthYearNum ?? undefined,
        wrappedKey: keys.wrappedKey,
        keySalt: keys.keySalt,
        recoveryWrappedKey: keys.recoveryWrappedKey,
        recoverySalt: keys.recoverySalt,
        referralCode,
      });
      login(res.accessToken);
      setSessionUserId(res.user.id);
      if (referralCode) trackGoal('referral_signup', { ref: referralCode });
      setRecoveryCode(code);
      setStep('recovery');
    } catch (err) {
      setError(getErrorMessage(err, t));
    }
  };

  const handleRecoveryConfirmed = () => {
    navigate('/my-day');
  };

  return {
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
    isAdult,
  };
}
