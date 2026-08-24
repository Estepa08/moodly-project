import { reportError } from './errorReporter';

/**
 * Decrypts a batch of entities, keeping only the ones that succeed.
 * Promise.all would reject the whole batch on the first failure — and a
 * single undecryptable item is an expected occurrence (e.g. entries left
 * over from before a password reset without a recovery code uses a new data
 * key), not a reason to empty every screen that reads this list.
 */
export async function decryptSettled<T, R>(
  items: T[],
  decrypt: (item: T) => Promise<R>,
  context: string,
): Promise<R[]> {
  const results = await Promise.allSettled(items.map(decrypt));
  const decrypted: R[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      decrypted.push(result.value);
      continue;
    }
    const err = result.reason;
    reportError({
      message: `decryptSettled [${context}] ${
        err instanceof Error ? `${err.name}: ${err.message}` : String(err)
      }`,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
  return decrypted;
}
