import { reportError } from '../../lib/errorReporter';

/**
 * Логирует реальную причину ошибки мутации (код/сообщение) на бэкенд
 * (POST /client-errors), чтобы в проде было видно первопричину, а не
 * переведённую фразу тоста. `scope` — короткий идентификатор мутации,
 * например `cba-create` или `emotion-lab-attempt`.
 */
export function reportMutationError(scope: string, err: unknown): void {
  const message =
    err instanceof Error
      ? `saveError [${scope}] ${err.name}: ${err.message}`
      : `saveError [${scope}] Unexpected error: ${String(err)}`;
  reportError({ message, stack: err instanceof Error ? err.stack : undefined });
}
