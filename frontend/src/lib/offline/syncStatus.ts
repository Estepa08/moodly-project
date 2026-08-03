export type SyncStatus = "idle" | "syncing" | "offline" | "error";

const listeners = new Set<() => void>();
let status: SyncStatus = typeof navigator !== "undefined" && navigator.onLine ? "idle" : "offline";

export function getSyncStatus(): SyncStatus {
  return status;
}

export function setSyncStatus(next: SyncStatus): void {
  if (status === next) return;
  status = next;
  emit();
}

export function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeSync(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
