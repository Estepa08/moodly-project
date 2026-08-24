import { describe, it, expect, vi, type Mock } from 'vitest';
import { renderWithProviders, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import AdminPanelPage from '../admin-panel';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    users: { me: vi.fn() },
    admin: {
      listUsers: vi.fn(),
      listFeedback: vi.fn(),
      deleteUser: vi.fn(),
      updateTier: vi.fn(),
    },
    auth: { refresh: vi.fn().mockRejectedValue(new Error('no session')) },
  },
  setToken: vi.fn(),
  setOnSessionExpired: vi.fn(),
  getToken: vi.fn(() => null),
}));

function mockAdminApi() {
  (api.users.me as Mock).mockResolvedValue({ id: '1', email: 'admin@example.com', role: 'admin' });
  (api.admin.listUsers as Mock).mockResolvedValue([]);
  (api.admin.listFeedback as Mock).mockResolvedValue([]);
}

describe('AdminPanelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Users and Feedback tabs', async () => {
    mockAdminApi();
    renderWithProviders(<AdminPanelPage />);
    expect(await screen.findByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
  });

  it('shows feedback list with author email, rating and message', async () => {
    mockAdminApi();
    (api.admin.listFeedback as Mock).mockResolvedValue([
      {
        id: '1',
        rating: 5,
        message: 'Great app!',
        createdAt: '2026-07-31T10:00:00.000Z',
        user: { email: 'user@example.com', name: 'User' },
      },
    ]);
    renderWithProviders(<AdminPanelPage />);
    await userEvent.click(await screen.findByText('Reviews'));
    expect(await screen.findByText('Great app!')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('5 / 5')).toBeInTheDocument();
  });

  it('shows empty state when there is no feedback', async () => {
    mockAdminApi();
    renderWithProviders(<AdminPanelPage />);
    await userEvent.click(await screen.findByText('Reviews'));
    expect(await screen.findByText('No reviews yet')).toBeInTheDocument();
  });

  it('toggling the premium switch calls updateTier with the new tier', async () => {
    mockAdminApi();
    (api.admin.listUsers as Mock).mockResolvedValue([
      {
        id: 'u1',
        email: 'plain@example.com',
        name: 'Plain User',
        role: 'user',
        createdAt: '2026-07-31T10:00:00.000Z',
        emailVerified: true,
        ageConfirmed: true,
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
        entriesCount: 0,
        testResultsCount: 0,
        breathingSessionsCount: 0,
        cbaEntriesCount: 0,
      },
    ]);
    (api.admin.updateTier as Mock).mockResolvedValue({
      id: 'u1',
      email: 'plain@example.com',
      subscriptionTier: 'premium',
    });

    renderWithProviders(<AdminPanelPage />);
    const toggles = await screen.findAllByRole('switch', { name: 'Premium' });
    await userEvent.click(toggles[0]);

    expect(api.admin.updateTier).toHaveBeenCalledWith('u1', 'premium');
  });
});
