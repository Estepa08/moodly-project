import { prisma } from "../lib/prisma.js";

const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY || "";
const PRIVATE_VAPID_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@moodly.app";

function getWebPush() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webPush = require("web-push");
    webPush.setVapidDetails(VAPID_SUBJECT, PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);
    return webPush;
  } catch {
    return null;
  }
}

export const notificationService = {
  async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: Record<string, string> },
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

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    const wp = getWebPush();
    if (!wp) return;

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const textPayload = JSON.stringify(payload);

    for (const sub of subs) {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          textPayload,
        );
      } catch {
        if ((wp as unknown as { WebPushError: unknown }).WebPushError) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  },
};
