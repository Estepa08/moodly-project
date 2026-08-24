import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../hooks/useAuth';
import ResetPasswordPage from '../reset-password';

vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      resetPassword: vi.fn(),
      recoveryInfo: vi.fn(),
      refresh: vi.fn().mockRejectedValue(new Error('no session')),
    },
  },
  setToken: vi.fn(),
  setOnSessionExpired: vi.fn(),
  getToken: vi.fn(() => null),
}));

import { api } from '../../lib/api';

vi.mock('../../lib/crypto/auth-keys', () => ({
  createFreshDataKey: vi.fn(async () => ({ wrappedKey: 'wrapped-1', keySalt: 'salt-1' })),
  rewrapDataKeyWithRecovery: vi.fn(),
}));

vi.mock('../../lib/crypto/session', () => ({
  setSessionUserId: vi.fn(),
}));

import { setSessionUserId } from '../../lib/crypto/session';

function renderAtResetUrl() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={['/reset-password?token=test-token']}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/my-day" element={<div>my-day-page</div>} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('arms the E2E decryption context with the userId from the reset response', async () => {
    // Regression test: setSessionUserId() used to never be called after a
    // reset, so every entry decrypt threw "Data key context is not
    // initialized" — the user's whole history looked like it had vanished
    // even though the password reset itself succeeded.
    (api.auth.resetPassword as Mock).mockResolvedValueOnce({
      accessToken: 'access-token',
      userId: 'user-42',
      message: 'Password reset successfully',
    });

    const user = userEvent.setup();
    renderAtResetUrl();

    await user.type(screen.getByLabelText('New Password'), 'newpass123');
    await user.type(screen.getByLabelText('Confirm Password'), 'newpass123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(setSessionUserId).toHaveBeenCalledWith('user-42');
    });
    expect(screen.getByText('my-day-page')).toBeInTheDocument();
  });
});
