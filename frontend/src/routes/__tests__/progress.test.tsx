import { describe, it, expect, vi, type Mock } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import ProgressRoute from '../progress';
import { api } from '../../lib/api';

// Классический режим (docs/plans/three-personas-design-gaps.md, Сессия 1):
// /progress целиком игровая надстройка, поэтому в classic редиректит на
// /my-day вместо пустого экрана/404 — пользователь мог сохранить прямую ссылку.
vi.mock('../../lib/api', () => ({
  api: {
    users: {
      me: vi.fn(),
    },
  },
}));

vi.mock('../../features/gamification/ProgressPage', () => ({
  default: () => <div>progress-page-content</div>,
}));

function renderProgressRoute() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/progress']}>
        <Routes>
          <Route path="/progress" element={<ProgressRoute />} />
          <Route path="/my-day" element={<div>my-day-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProgressRoute', () => {
  it('renders ProgressPage for companion mode', async () => {
    (api.users.me as Mock).mockResolvedValue({ interfaceMode: 'companion' });
    renderProgressRoute();
    expect(await screen.findByText('progress-page-content')).toBeInTheDocument();
  });

  it('redirects to /my-day for classic mode instead of showing an empty screen', async () => {
    (api.users.me as Mock).mockResolvedValue({ interfaceMode: 'classic' });
    renderProgressRoute();
    await waitFor(() => expect(screen.getByText('my-day-page')).toBeInTheDocument());
    expect(screen.queryByText('progress-page-content')).not.toBeInTheDocument();
  });
});
