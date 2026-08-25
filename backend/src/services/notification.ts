import webPush from 'web-push';
import { prisma } from '../lib/prisma.js';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@moodly.app';

// В dev/test/CI VAPID-ключи обычно не настроены (push там не используется) —
// setVapidDetails с пустым ключом бросает исключение прямо при импорте модуля,
// поэтому вызываем его только когда оба ключа реально заданы.
const vapidConfigured = Boolean(PUBLIC_VAPID_KEY && PRIVATE_VAPID_KEY);
if (vapidConfigured) {
  webPush.setVapidDetails(VAPID_SUBJECT, PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);
}

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  keys: unknown;
};

async function sendToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: PushPayload,
): Promise<number> {
  if (!vapidConfigured) return 0;

  const textPayload = JSON.stringify(payload);
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
        textPayload,
      );
      sent += 1;
    } catch (err) {
      if (err instanceof webPush.WebPushError) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return sent;
}

export const notificationService = {
  async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });
    if (existing) {
      if (existing.userId !== userId) {
        await prisma.pushSubscription.update({
          where: { endpoint: subscription.endpoint },
          data: { userId },
        });
      }
      return existing;
    }
    return prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });
  },

  async unsubscribe(userId: string, endpoint: string) {
    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  },

  async sendToUser(userId: string, payload: PushPayload) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    return sendToSubscriptions(subs, payload);
  },

  async sendToAll(payload: PushPayload) {
    const subs = await prisma.pushSubscription.findMany();
    return sendToSubscriptions(subs, payload);
  },
};
