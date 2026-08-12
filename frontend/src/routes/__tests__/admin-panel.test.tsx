import { describe, it, expect, vi, type Mock } from 'vitest';
import { renderWithProviders, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import AdminPanelPage from '../admin-panel';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    users: { me: vi.fn() },
    admin: { listUsers: vi.fn(), listFeedback: vi.fn(), deleteUser: vi.fn() },
    auth: { refresh: vi.fn().mockRejectedValue(new Error('no session')) },
  },
  setToken: vi.fn(),
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
});
