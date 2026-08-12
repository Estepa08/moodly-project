import { describe, it, expect, vi, type Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, fireEvent, within } from '../../test/test-utils';
import Statistics from '../statistics';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    users: { me: vi.fn() },
    parameters: { list: vi.fn() },
    entries: { list: vi.fn(), create: vi.fn() },
    auth: {
      logout: vi.fn(),
      demo: vi.fn(),
      refresh: vi.fn().mockRejectedValue(new Error('no session')),
    },
    tests: { list: vi.fn(), get: vi.fn(), submitResult: vi.fn() },
    testResults: { list: vi.fn() },
    feedback: { create: vi.fn(), listMine: vi.fn() },
    onboarding: { list: vi.fn() },
    reports: { create: vi.fn(), list: vi.fn(), get: vi.fn(), delete: vi.fn() },
    creature: {
      getState: vi.fn().mockRejectedValue(new Error('no creature')),
      getCompletions: vi.fn().mockResolvedValue([]),
    },
    cba: {
      examples: vi.fn().mockResolvedValue([]),
      commonItems: vi.fn().mockResolvedValue([]),
      entries: { list: vi.fn().mockResolvedValue([]), create: vi.fn(), delete: vi.fn() },
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(() => null),
}));

function mockDashboardApi() {
  (api.parameters.list as Mock).mockResolvedValue([
    { id: '1', name: 'Mood', unit: '/10' },
    { id: '2', name: 'Anxiety', unit: '/10' },
  ]);
  (api.entries.list as Mock).mockResolvedValue([]);
  (api.testResults.list as Mock).mockResolvedValue([]);
  (api.tests.list as Mock).mockResolvedValue([]);
}

describe('Statistics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders statistics page sections', async () => {
    mockDashboardApi();
    renderWithProviders(<Statistics />);

    // Wellbeing accordion header
    expect(screen.getByText('Wellbeing')).toBeInTheDocument();

    // Tests taken card (empty state)
    expect(await screen.findByText('Tests Taken')).toBeInTheDocument();

    // Radar, tests and distortion-trap blocks each have their own period dropdown
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
    expect(screen.getAllByText('2 Weeks').length).toBeGreaterThanOrEqual(1);

    // Thinking patterns radar is always visible (empty state without CD results)
    expect(screen.getByText('Thinking Patterns')).toBeInTheDocument();
    expect(screen.getByText('No thinking patterns test yet')).toBeInTheDocument();

    // Distortion traps card (empty state)
    expect(screen.getByText('Thinking Traps')).toBeInTheDocument();
    expect(screen.getByText('No trap tags yet')).toBeInTheDocument();

    // Legacy digest sections removed
    expect(screen.queryByText('Weekly Averages')).not.toBeInTheDocument();
    expect(screen.queryByText('Weekly Digest')).not.toBeInTheDocument();
    expect(screen.queryByText("Today's check-in pending")).not.toBeInTheDocument();
  });

  it('shows quick entry by default and toggles the wellbeing panel', async () => {
    mockDashboardApi();
    renderWithProviders(<Statistics />);

    // Panel is expanded by default
    expect(await screen.findByText('Quick Entry')).toBeInTheDocument();

    // Clicking Wellbeing collapses the panel and persists the choice
    fireEvent.click(screen.getByText('Wellbeing'));
    expect(screen.queryByText('Quick Entry')).not.toBeInTheDocument();
    expect(localStorage.getItem('moodly_wellbeing_open')).toBe('0');

    // Clicking again reopens it
    fireEvent.click(screen.getByText('Wellbeing'));
    expect(await screen.findByText('Quick Entry')).toBeInTheDocument();
    expect(localStorage.getItem('moodly_wellbeing_open')).toBe('1');
  });

  it('marks quick entry icons as saved when a param has a today entry', async () => {
    mockDashboardApi();
    (api.entries.list as Mock).mockResolvedValue([
      {
        id: 'e1',
        userId: 'u1',
        parameterId: '1',
        value: 7,
        createdAt: new Date().toISOString(),
      },
    ]);
    renderWithProviders(<Statistics />);

    expect(await screen.findByTestId('quick-entry-saved-Mood')).toBeInTheDocument();
    expect(screen.queryByTestId('quick-entry-saved-Anxiety')).not.toBeInTheDocument();
  });

  it('renders thinking patterns radar when CD results are in the period', async () => {
    mockDashboardApi();
    (api.testResults.list as Mock).mockResolvedValue([
      {
        id: 'r1',
        testId: 'cd1',
        score: 3,
        interpretation: 'Mild',
        recommendation: 'Track your mood',
        completedAt: new Date().toISOString(),
        flags: { distortions: { allOrNothing: { score: 5 } } },
      },
    ]);
    renderWithProviders(<Statistics />);

    expect(await screen.findByText('Thinking Patterns')).toBeInTheDocument();
    expect(screen.queryByText('No thinking patterns test yet')).not.toBeInTheDocument();
    expect(await screen.findByText('Take the test again to see the trend.')).toBeInTheDocument();
  });

  it('filters test results by the selected period', async () => {
    const user = userEvent.setup();
    mockDashboardApi();
    const now = Date.now();
    (api.testResults.list as Mock).mockResolvedValue([
      {
        id: 'r1',
        testId: 't1',
        score: 5,
        interpretation: 'Mild',
        recommendation: 'x',
        completedAt: new Date(now).toISOString(),
      },
      {
        id: 'r2',
        testId: 't1',
        score: 9,
        interpretation: 'Moderate',
        recommendation: 'y',
        completedAt: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    (api.tests.list as Mock).mockResolvedValue([{ id: 't1', title: 'Mood Test' }]);
    renderWithProviders(<Statistics />);

    // Default period (2 weeks): the 30-day-old result is excluded
    expect(await screen.findByText('Mood Test')).toBeInTheDocument();
    expect(screen.getByText('1 taken')).toBeInTheDocument();
    expect(screen.queryByText('Moderate')).not.toBeInTheDocument();

    // Switch the tests dropdown to 1 Month — the 30-day-old result now appears
    const testsCard = screen.getByText('Tests Taken').closest('.rounded-xl') as HTMLElement;
    await user.click(within(testsCard).getByRole('combobox'));
    await user.click(within(await screen.findByRole('listbox')).getByText('1 Month'));
    expect(await screen.findByText('2 taken')).toBeInTheDocument();

    // Expanding the test shows the older run's interpretation too
    fireEvent.click(screen.getByText('Mood Test'));
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('expands a test to show run history and details', async () => {
    mockDashboardApi();
    const now = Date.now();
    (api.testResults.list as Mock).mockResolvedValue([
      {
        id: 'r1',
        testId: 't1',
        score: 3,
        interpretation: 'Minimal',
        recommendation: 'Keep it up',
        completedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'r2',
        testId: 't1',
        score: 7,
        interpretation: 'Moderate',
        recommendation: 'Consider support',
        completedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
    (api.tests.list as Mock).mockResolvedValue([{ id: 't1', title: 'Mood Test' }]);
    renderWithProviders(<Statistics />);

    fireEvent.click(await screen.findByText('Mood Test'));

    // Run history is now visible
    expect(screen.getByText('2 taken')).toBeInTheDocument();

    // Expanding an attempt shows its interpretation and recommendation
    fireEvent.click(screen.getByText('Moderate'));
    expect(await screen.findByText('Consider support')).toBeInTheDocument();
  });
});
