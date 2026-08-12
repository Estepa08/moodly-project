import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { listLocalTestResults } from '../lib/offline/db';
import type { components } from '../lib/api-types';
import { decryptTestResultPayload } from '../lib/crypto/records';

export function useTests() {
  return useQuery({
    queryKey: ['tests'],
    queryFn: () => api.tests.list(),
    staleTime: 60_000,
  });
}

export function useTest(id?: string) {
  return useQuery({
    queryKey: ['test', id],
    queryFn: () => api.tests.get(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

type TestResult = components['schemas']['TestResult'];

export interface DecryptedTestResult extends TestResult {
  score: number;
  interpretation: string;
  recommendation: string;
  flags?: Record<string, unknown>;
  maxScore?: number;
}

async function decryptResult(r: TestResult): Promise<DecryptedTestResult> {
  if (!r.encryptedData) {
    return {
      ...r,
      score: r.score ?? 0,
      interpretation: r.interpretation ?? '',
      recommendation: r.recommendation ?? '',
      flags: r.flags as Record<string, unknown> | undefined,
    };
  }
  const payload = await decryptTestResultPayload(r.encryptedData, r.id);
  return {
    ...r,
    score: payload.score,
    interpretation: payload.interpretation,
    recommendation: payload.recommendation,
    flags: payload.flags,
    maxScore: payload.maxScore,
  };
}

export function useTestResults(testId?: string) {
  return useQuery({
    queryKey: ['testResults', testId],
    queryFn: async () => {
      const raw = navigator.onLine
        ? await api.testResults.list(testId)
        : await listLocalTestResults(testId);
      return Promise.all((raw as TestResult[]).map(decryptResult));
    },
    staleTime: 30_000,
  });
}
