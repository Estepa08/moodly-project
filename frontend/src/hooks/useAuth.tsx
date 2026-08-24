import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { setToken, setOnSessionExpired, api } from '../lib/api';
import { ONBOARDING_DONE_KEY, HAS_ACCOUNT_KEY } from '../lib/constants';
import { clearSessionKey } from '../lib/crypto/session';

interface AuthContextValue {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // The access token now lives only in memory (not localStorage), so on a
  // fresh page load we have to re-derive auth state from the httpOnly
  // refresh cookie via a silent refresh before we know if the user is logged in.
  useEffect(() => {
    api.auth
      .refresh()
      .then((data) => {
        setToken(data.accessToken);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setToken(null);
        setIsAuthenticated(false);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  // A refresh can also fail mid-session — not just at bootstrap — when the
  // refresh cookie was revoked elsewhere (e.g. a password reset from another
  // tab/device). Without this, isAuthenticated stayed stuck at true and every
  // request kept 401-ing forever with no way back to the login screen.
  useEffect(() => {
    setOnSessionExpired(() => {
      queryClient.clear();
      setToken(null);
      setIsAuthenticated(false);
      clearSessionKey();
      toast.error(t('errors.sessionExpired'));
    });
    return () => setOnSessionExpired(null);
  }, [queryClient, t]);

  const login = useCallback(
    (token: string) => {
      queryClient.clear();
      setToken(token);
      setIsAuthenticated(true);
      localStorage.setItem(HAS_ACCOUNT_KEY, '1');
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    // Best-effort: this also clears the httpOnly refresh cookie server-side,
    // which the client has no way to remove itself.
    try {
      await api.auth.logout();
    } catch {
      // Ignore — we still clear local state below.
    }
    queryClient.clear();
    setToken(null);
    setIsAuthenticated(false);
    clearSessionKey();
    localStorage.removeItem(ONBOARDING_DONE_KEY);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isBootstrapping, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
