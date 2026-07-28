import { useState, useCallback } from "react";
import { api } from "../lib/api";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );
  const [subscribing, setSubscribing] = useState(false);

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

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return false;

    const allowed = await requestPermission();
    if (!allowed) return false;

    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const sub = existing.toJSON();
        await api.push.subscribe({
          endpoint: sub.endpoint!,
          keys: sub.keys as { p256dh: string; auth: string },
        });
        return true;
      }

      const applicationServerKey = urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || "",
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });

      const sub = subscription.toJSON();
      await api.push.subscribe({
        endpoint: sub.endpoint!,
        keys: sub.keys as { p256dh: string; auth: string },
      });
      return true;
    } catch {
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [requestPermission]);

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
    } catch {
      // ignore
    }
  }, []);

  return {
    permission,
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
