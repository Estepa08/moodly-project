import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTestFlow } from '../useTestFlow';
import * as crypto from '../../lib/crypto/records';
import * as offlineSync from '../../lib/offline/sync';

vi.mock('../useTests', () => ({
  useTest: vi.fn(() => ({
    data: {
      id: 'test-id',
      type: 'example',
      questions: [
        { id: 'q1', options: [{ id: 'o1' }] },
        { id: 'q2', options: [{ id: 'o2' }] },
      ],
      scoreBands: [],
    },
    isLoading: false,
  })),
}));

vi.mock('../../lib/crypto/records', () => ({
  encryptTestResultPayload: vi.fn(() => Promise.resolve('encryptedDataMock')),
}));

vi.mock('../../lib/offline/sync', () => ({
  enqueue: vi.fn(() => Promise.resolve()),
}));

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: new QueryClient() }, children);
}

describe('useTestFlow hook', () => {
  it('handles scoring, encryption, and enqueuing correctly', async () => {
    const { result } = renderHook(() => useTestFlow('test-id'), { wrapper });

    act(() => {
      result.current.handleAnswer('o1');
      result.current.handleNext();
      result.current.handleAnswer('o2');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(crypto.encryptTestResultPayload).toHaveBeenCalled();
    expect(offlineSync.enqueue).toHaveBeenCalledWith(
      'testResult',
      'upsert',
      expect.any(String),
      expect.objectContaining({ testId: 'test-id', encryptedData: 'encryptedDataMock' }),
    );

    expect(result.current.result).not.toBeNull();
    if (result.current.result) {
      expect(result.current.result.score).toBeDefined();
      expect(result.current.result.interpretation).toBeDefined();
    }
  });
});
