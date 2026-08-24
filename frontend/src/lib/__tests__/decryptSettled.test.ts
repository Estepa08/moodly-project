import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decryptSettled } from '../decryptSettled';

vi.mock('../errorReporter', () => ({
  reportError: vi.fn(),
}));

import { reportError } from '../errorReporter';

describe('decryptSettled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the entries that decrypt successfully when one item fails', async () => {
    // Mirrors the real bug: one entry left over from a data-key rotation
    // (e.g. password reset without a recovery code) must not take the
    // whole list down with it.
    const items = ['a', 'bad', 'c'];
    const decrypt = vi.fn(async (item: string) => {
      if (item === 'bad') throw new Error('OperationError: auth tag mismatch');
      return item.toUpperCase();
    });

    const result = await decryptSettled(items, decrypt, 'entries');

    expect(result).toEqual(['A', 'C']);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('decryptSettled [entries]'),
      }),
    );
  });

  it('returns everything when nothing fails', async () => {
    const result = await decryptSettled([1, 2, 3], async (n) => n * 2, 'entries');
    expect(result).toEqual([2, 4, 6]);
    expect(reportError).not.toHaveBeenCalled();
  });

  it('returns an empty array when every item fails, instead of throwing', async () => {
    const result = await decryptSettled(
      [1, 2],
      async () => {
        throw new Error('boom');
      },
      'entries',
    );
    expect(result).toEqual([]);
    expect(reportError).toHaveBeenCalledTimes(2);
  });
});
