import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderWithProviders, screen, waitFor } from '../../test/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../hooks/useAuth';
import { render } from '@testing-library/react';
import LoginPage from '../login';
import userEvent from '@testing-library/user-event';
import { createRegistrationKeys } from '../../lib/crypto/auth-keys';
import { clearSessionKey } from '../../lib/crypto/session';

vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn().mockRejectedValue(new Error('no session')),
      setKeys: vi.fn(),
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

import { api } from '../../lib/api';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSessionKey();
  });

  it('renders the login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Moodly')).toBeInTheDocument();
    expect(
      screen.getByText("A simple mood journal — notice how you're doing, day by day."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('does not render the registration fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.queryByLabelText('Name (optional)')).not.toBeInTheDocument();
  });

  it('links to the register page instead of toggling', () => {
    renderWithProviders(<LoginPage />);
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('submits form and navigates on success', async () => {
    const keys = await createRegistrationKeys('secret', 'CODE-1234');
    (api.auth.login as Mock).mockResolvedValueOnce({
      accessToken: 'token123',
      user: { id: '1' },
      wrappedKey: keys.wrappedKey,
      keySalt: keys.keySalt,
    });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret',
      });
    });
  });

  it('migrates a legacy account (no E2E keys) and shows the recovery screen', async () => {
    (api.auth.login as Mock).mockResolvedValueOnce({
      accessToken: 'token123',
      user: { id: '1' },
    });
    (api.auth.setKeys as Mock).mockResolvedValue({ ok: true });

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'legacy@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(api.auth.setKeys).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(/your account has been upgraded/i)).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    (api.auth.login as Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    await user.type(emailInput, 'bad@example.com');
    await user.type(passwordInput, 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows the unlock-required banner when arriving via ProtectedRoute redirect', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { reason: 'unlock-required' } }]}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={children} />
            </Routes>
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    render(<LoginPage />, { wrapper });
    expect(screen.getByText('Enter your password to unlock your entries')).toBeInTheDocument();
  });
});
