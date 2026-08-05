import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setToken, api } from "../lib/api";
import { ONBOARDING_DONE_KEY } from "../lib/constants";
import { clearSessionKey } from "../lib/crypto/session";

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

  const login = useCallback(
    (token: string) => {
      queryClient.clear();
      setToken(token);
      setIsAuthenticated(true);
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
