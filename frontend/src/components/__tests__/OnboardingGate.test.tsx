import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { screen, waitFor } from '../../test/test-utils';
import { renderWithProviders } from '../../test/test-utils';
import OnboardingGate from '../OnboardingGate';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    auth: {
      refresh: vi.fn().mockRejectedValue(new Error('no session')),
    },
    users: {
      getPreferences: vi.fn(),
      savePreferences: vi.fn(),
    },
    push: {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    },
  },
  setToken: vi.fn(),
  setOnSessionExpired: vi.fn(),
  getToken: vi.fn(() => null),
}));

const CHILD_TEXT = 'protected-content';

describe('OnboardingGate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('redirects away when onboarding is not done yet', async () => {
    (api.users.getPreferences as Mock).mockResolvedValue(null);
    renderWithProviders(
      <OnboardingGate>
        <div>{CHILD_TEXT}</div>
      </OnboardingGate>,
    );

    await waitFor(() => expect(api.users.getPreferences).toHaveBeenCalled());
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });

  it('renders children when onboarding is done', async () => {
    (api.users.getPreferences as Mock).mockResolvedValue({
      goals: [],
      experienceLevel: 'beginner',
      dailyReminder: false,
      onboardingDone: true,
      showSupportResources: true,
    });
    renderWithProviders(
      <OnboardingGate>
        <div>{CHILD_TEXT}</div>
      </OnboardingGate>,
    );

    expect(await screen.findByText(CHILD_TEXT)).toBeInTheDocument();
  });

  it('shows a loader while preferences are loading', () => {
    (api.users.getPreferences as Mock).mockReturnValue(new Promise(() => {}));
    renderWithProviders(
      <OnboardingGate>
        <div>{CHILD_TEXT}</div>
      </OnboardingGate>,
    );

    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });
});
