import { useState, useCallback, useEffect } from "react";
import { api } from "../lib/api";
import { getVapidPublicKey } from "../lib/vapid";

export type PushSubscribeError = "no-vapid" | "no-sw" | "denied" | "failed";

export interface PushSubscribeResult {
  ok: boolean;
  error?: PushSubscribeError;
}

export interface PushSubscribeOptions {
  silent?: boolean;
}

const SERVICE_WORKER_READY_TIMEOUT = 10_000;

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "denied") return false;
    if (Notification.permission === "granted") {
      setPermission("granted");
      return true;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const subscribe = useCallback(
    async (opts?: { silent?: boolean }): Promise<PushSubscribeResult> => {
      if (typeof navigator === "undefined" || !navigator.serviceWorker) {
        return { ok: false, error: "no-sw" };
      }

      const vapidPublicKey = getVapidPublicKey();
      if (!vapidPublicKey) {
        console.warn("[push] VITE_VAPID_PUBLIC_KEY не задан — подписка на push недоступна");
        return { ok: false, error: "no-vapid" };
      }

      if (typeof Notification === "undefined") return { ok: false, error: "denied" };

      const silent = opts?.silent ?? false;
      if (silent && Notification.permission !== "granted") {
        return { ok: false, error: "denied" };
      }

      const allowed = await requestPermission();
      if (!allowed) return { ok: false, error: "denied" };

      setSubscribing(true);
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("service-worker-ready-timeout")),
              SERVICE_WORKER_READY_TIMEOUT,
            ),
          ),
        ]);
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          const sub = existing.toJSON();
          await api.push.subscribe({
            endpoint: sub.endpoint!,
            keys: sub.keys as { p256dh: string; auth: string },
          });
          setSubscribed(true);
          return { ok: true };
        }

        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as unknown as BufferSource,
        });

        const sub = subscription.toJSON();
        await api.push.subscribe({
          endpoint: sub.endpoint!,
          keys: sub.keys as { p256dh: string; auth: string },
        });
        setSubscribed(true);
        return { ok: true };
      } catch {
        return { ok: false, error: "failed" };
      } finally {
        setSubscribing(false);
      }
    },
    [requestPermission],
  );

  const unsubscribe = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        if (endpoint) {
          await api.push.unsubscribe({ endpoint });
        }
      }
      setSubscribed(false);
    } catch {
      // ignore
    }
  }, []);

  return {
    permission,
    subscribed,
    subscribing,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr;
}
