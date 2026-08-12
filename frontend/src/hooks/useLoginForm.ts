import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/error-messages';
import { unlockDataKeyFromLogin, createRegistrationKeys } from '../lib/crypto/auth-keys';
import { generateRecoveryCode } from '../lib/crypto/keys';
import { setSessionUserId } from '../lib/crypto/session';

const DEMO_MODE = import.meta.env.DEV;

export type LoginStep = 'form' | 'recovery';

export function useLoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // Сообщение о разблокировке, если приложение вернулось из «мёртвой» сессии
  // (DEK в sessionStorage потерян после простоя вкладки). Передаётся через
  // <Navigate state={{ reason: "unlock-required" }}> из ProtectedRoute.
  const unlockRequired =
    (location.state as { reason?: string } | null)?.reason === 'unlock-required';
  const [demoLoading, setDemoLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('form');
  const [recoveryCode, setRecoveryCode] = useState('');

  async function authenticate(loginPassword: string, loginEmail: string, isDemo: boolean) {
    const res = await api.auth.login({ email: loginEmail, password: loginPassword });
    // Токен нужен для последующего авторизованного set-keys (миграция legacy).
    login(res.accessToken);
    setSessionUserId(res.user.id);

    if (res.wrappedKey && res.keySalt) {
      await unlockDataKeyFromLogin(loginPassword, res.wrappedKey, res.keySalt);
      navigate('/my-day');
      return;
    }

    // Legacy-учётка (создана до E2E-шифрования): генерируем DEK и recovery-код,
    // сохраняем ключи на сервере. Демо проходит без экрана recovery.
    const code = generateRecoveryCode();
    const keys = await createRegistrationKeys(loginPassword, code);
    await api.auth.setKeys(keys);
    if (isDemo) {
      navigate('/my-day');
    } else {
      setRecoveryCode(code);
      setStep('recovery');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await authenticate(password, email, false);
    } catch (err) {
      setError(getErrorMessage(err, t));
    }
  };

  const handleDemo = async () => {
    if (!import.meta.env.DEV) return;
    setDemoLoading(true);
    setError('');
    try {
      await authenticate('demo123', 'demo@moodly.app', true);
    } catch (err) {
      setError(getErrorMessage(err, t));
    } finally {
      setDemoLoading(false);
    }
  };

  const handleRecoveryConfirmed = () => {
    navigate('/my-day');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    unlockRequired,
    demoMode: DEMO_MODE,
    demoLoading,
    step,
    recoveryCode,
    handleSubmit,
    handleDemo,
    handleRecoveryConfirmed,
  };
}
