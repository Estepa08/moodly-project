import { useCallback, useEffect, useRef, useState } from "react";
import { getDb } from "./db";
import { syncNow } from "./sync";
import { getSyncStatus, setSyncStatus, subscribeSync } from "./syncStatus";

export type SyncStatus = "idle" | "syncing" | "offline" | "error";

async function pendingCount(): Promise<number> {
  return getDb().outbox.count();
}

export function useSync(options?: { onSynced?: () => void | Promise<void> }) {
  const [state, setState] = useState<SyncStatus>(getSyncStatus());
  const [pending, setPending] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const syncingRef = useRef(false);
  const onSyncedRef = useRef(options?.onSynced);
  onSyncedRef.current = options?.onSynced;

  const refreshPending = useCallback(async () => {
    setPending(await pendingCount());
  }, []);

  const run = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncStatus("syncing");
    try {
      await syncNow();
      setLastSyncAt(new Date());
      setSyncStatus(navigator.onLine ? "idle" : "offline");
      await onSyncedRef.current?.();
    } catch {
      setSyncStatus(navigator.onLine ? "error" : "offline");
    } finally {
      syncingRef.current = false;
      await refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => subscribeSync(() => {
    setState(getSyncStatus());
    void refreshPending();
  }), [refreshPending]);

  useEffect(() => {
    const onOnline = () => void run();
    const onOffline = () => setSyncStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [run]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  return { status: state, pending, lastSyncAt, sync: run, refreshPending };
}