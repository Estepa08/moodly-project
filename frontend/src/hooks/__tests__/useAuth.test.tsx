import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../useAuth';
import { setOnSessionExpired } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      refresh: vi.fn().mockRejectedValue(new Error('no session')),
      logout: vi.fn().mockResolvedValue(undefined),
    },
  },
  setToken: vi.fn(),
  setOnSessionExpired: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

function AuthProbe() {
  const { login, logout } = useAuth();
  return (
    <div>
      <button type="button" onClick={() => login('access-token')}>
        login
      </button>
      <button type="button" onClick={() => logout()}>
        logout
      </button>
    </div>
  );
}

function renderWithClient(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the query cache on login so a previous user's data does not leak", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();

    queryClient.setQueryData(['userMe'], { id: 'demo', role: 'user' });
    queryClient.setQueryData(['entries'], [{ id: 'e1' }]);

    renderWithClient(queryClient);

    await user.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(queryClient.getQueryData(['userMe'])).toBeUndefined();
      expect(queryClient.getQueryData(['entries'])).toBeUndefined();
    });
  });

  it('clears the query cache on logout', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();

    queryClient.setQueryData(['userMe'], { id: 'admin', role: 'admin' });

    renderWithClient(queryClient);

    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(queryClient.getQueryData(['userMe'])).toBeUndefined();
    });
  });

  it('logs the user out when a mid-session refresh fails (e.g. a password reset revoked the cookie elsewhere)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(['userMe'], { id: 'demo', role: 'user' });

    function AuthStateProbe() {
      const { isAuthenticated } = useAuth();
      return <div data-testid="auth-state">{String(isAuthenticated)}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthStateProbe />
        </AuthProvider>
      </QueryClientProvider>,
    );

    // AuthProvider registers the app-wide session-expired handler on mount.
    const calls = vi.mocked(setOnSessionExpired).mock.calls;
    const handler = calls[calls.length - 1]?.[0];
    expect(handler).toBeInstanceOf(Function);

    handler!();

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('false');
      expect(queryClient.getQueryData(['userMe'])).toBeUndefined();
    });
  });
});
