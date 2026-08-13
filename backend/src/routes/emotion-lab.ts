import { FastifyInstance } from 'fastify';
import { getDailyAttemptLimit } from '../entitlements.js';
import { prisma } from '../lib/prisma.js';
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from '../lib/errors.js';
import { emotionAlchemy } from '@moodly/shared';
import {
  findDyad,
  getAvailableLevel,
  isSameDay,
  getNextMidnight,
} from '../services/emotion-lab.js';

interface JWTUser {
  userId: string;
  email?: string;
  [key: string]: unknown;
}

export default async function emotionLabRoutes(fastify: FastifyInstance) {
  fastify.get('/emotion-lab/state', { preHandler: [fastify.authenticate] }, async (req) => {
    const user = req.user as JWTUser;
    if (!user || !user.userId) {
      throw new UnauthorizedError('Unauthorized - user not found');
    }

    const userId = user.userId;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionExpiresAt: true },
    });

    if (!dbUser) {
      throw new NotFoundError('User');
    }

    let progress = await prisma.emotionLabProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await prisma.emotionLabProgress.create({
        data: { userId, dailyAttemptsUsed: 0, discoveredDyads: [] },
      });
    }

    const limit = getDailyAttemptLimit(dbUser);
    const now = new Date();
    const isNewDay = !progress.lastAttemptDate || !isSameDay(progress.lastAttemptDate, now);
    const usedToday = isNewDay ? 0 : progress.dailyAttemptsUsed;
    const limitReached = usedToday >= limit;
    const discovered = progress.discoveredDyads || [];
    const availableLevel = getAvailableLevel(discovered);

    return {
      tier: dbUser.subscriptionTier,
      dailyLimit: limit,
      attemptsUsed: usedToday,
      attemptsRemaining: Math.max(0, limit - usedToday),
      resetsAt: getNextMidnight(),
      limitReached,
      discoveredDyads: discovered,
      discoveredCount: discovered.length,
      totalDyads: Object.keys(emotionAlchemy).length,
      availableLevel,
    };
  });

  fastify.post(
    '/emotion-lab/attempt',
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const user = req.user as JWTUser;
      if (!user || !user.userId) {
        throw new UnauthorizedError('Unauthorized - user not found');
      }

      const userId = user.userId;
      const { emotionA, emotionB } = req.body as { emotionA: string; emotionB: string };

      if (!emotionA || !emotionB) {
        throw new ValidationError('emotionA and emotionB are required');
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, subscriptionExpiresAt: true },
      });

      if (!dbUser) {
        throw new NotFoundError('User');
      }

      let progress = await prisma.emotionLabProgress.findUnique({
        where: { userId },
      });

      if (!progress) {
        progress = await prisma.emotionLabProgress.create({
          data: { userId, dailyAttemptsUsed: 0, discoveredDyads: [] },
        });
      }

      const limit = getDailyAttemptLimit(dbUser);
      const now = new Date();
      const isNewDay = !progress.lastAttemptDate || !isSameDay(progress.lastAttemptDate, now);
      const usedToday = isNewDay ? 0 : progress.dailyAttemptsUsed;

      if (usedToday >= limit) {
        // Не AppError: клиенту нужны limit/tier/resetsAt, а не только code+message.
        return reply.code(403).send({
          error: 'daily_limit_reached',
          limit,
          tier: dbUser.subscriptionTier,
          resetsAt: getNextMidnight(),
        });
      }

      const dyad = findDyad(emotionA, emotionB);
      if (!dyad) {
        throw new ValidationError('Invalid emotion pair');
      }

      const discovered = progress.discoveredDyads || [];
      const availableLevel = getAvailableLevel(discovered);

      if (dyad.level > availableLevel) {
        throw new AppError('LEVEL_LOCKED', 403, `Unlock all ${dyad.level - 1} level dyads first`);
      }

      const isNewDiscovery = !discovered.includes(dyad.key);
      const updatedDiscovered = isNewDiscovery ? [...discovered, dyad.key] : discovered;

      const updated = await prisma.emotionLabProgress.update({
        where: { userId },
        data: {
          dailyAttemptsUsed: usedToday + 1,
          lastAttemptDate: now,
          discoveredDyads: updatedDiscovered,
        },
      });

      const newLimit = getDailyAttemptLimit(dbUser);
      const newUsed = updated.dailyAttemptsUsed;
      const newAvailableLevel = getAvailableLevel(updatedDiscovered);

      return {
        dyad,
        isNewDiscovery,
        discoveredDyads: updatedDiscovered,
        discoveredCount: updatedDiscovered.length,
        totalDyads: Object.keys(emotionAlchemy).length,
        availableLevel: newAvailableLevel,
        dailyLimit: newLimit,
        attemptsUsed: newUsed,
        attemptsRemaining: Math.max(0, newLimit - newUsed),
        resetsAt: getNextMidnight(),
        tier: dbUser.subscriptionTier,
        limitReached: newUsed >= newLimit,
      };
    },
  );
}
