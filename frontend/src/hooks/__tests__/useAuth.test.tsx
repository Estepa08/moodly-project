import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../useAuth';

vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      refresh: vi.fn().mockRejectedValue(new Error('no session')),
      logout: vi.fn().mockResolvedValue(undefined),
    },
  },
  setToken: vi.fn(),
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
});
