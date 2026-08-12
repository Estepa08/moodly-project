import { FastifyInstance } from 'fastify';
import { getDailyAttemptLimit } from '../entitlements.js';
import { prisma } from '../lib/prisma.js';
import { emotionAlchemy } from '@moodly/shared';
import {
  findDyad,
  getAvailableLevel,
  isSameDay,
  getNextMidnight,
} from '../services/emotion-lab.js';

// Определяем тип для пользователя из JWT
interface JWTUser {
  userId: string;
  email?: string;
  [key: string]: unknown;
}

export default async function emotionLabRoutes(fastify: FastifyInstance) {
  // Получение состояния
  fastify.get('/emotion-lab/state', { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const user = req.user as JWTUser;

      if (!user || !user.userId) {
        return reply.code(401).send({ error: 'Unauthorized - user not found' });
      }

      const userId = user.userId;

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionTier: true,
          subscriptionExpiresAt: true,
        },
      });

      if (!dbUser) {
        return reply.code(404).send({ error: 'User not found' });
      }

      let progress = await prisma.emotionLabProgress.findUnique({
        where: { userId },
      });

      if (!progress) {
        progress = await prisma.emotionLabProgress.create({
          data: {
            userId,
            dailyAttemptsUsed: 0,
            discoveredDyads: [],
          },
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
    } catch (error) {
      console.error('Error in /emotion-lab/state:', error);
      return reply.code(500).send({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Попытка смешивания
  fastify.post(
    '/emotion-lab/attempt',
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      try {
        const user = req.user as JWTUser;

        if (!user || !user.userId) {
          return reply.code(401).send({ error: 'Unauthorized - user not found' });
        }

        const userId = user.userId;
        const { emotionA, emotionB } = req.body as { emotionA: string; emotionB: string };

        if (!emotionA || !emotionB) {
          return reply.code(400).send({ error: 'emotionA and emotionB are required' });
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            subscriptionTier: true,
            subscriptionExpiresAt: true,
          },
        });

        if (!dbUser) {
          return reply.code(404).send({ error: 'User not found' });
        }

        let progress = await prisma.emotionLabProgress.findUnique({
          where: { userId },
        });

        if (!progress) {
          progress = await prisma.emotionLabProgress.create({
            data: {
              userId,
              dailyAttemptsUsed: 0,
              discoveredDyads: [],
            },
          });
        }

        const limit = getDailyAttemptLimit(dbUser);
        const now = new Date();
        const isNewDay = !progress.lastAttemptDate || !isSameDay(progress.lastAttemptDate, now);
        const usedToday = isNewDay ? 0 : progress.dailyAttemptsUsed;

        if (usedToday >= limit) {
          return reply.code(403).send({
            error: 'daily_limit_reached',
            limit,
            tier: dbUser.subscriptionTier,
            resetsAt: getNextMidnight(),
          });
        }

        const dyad = findDyad(emotionA, emotionB);
        if (!dyad) {
          return reply.code(400).send({ error: 'Invalid emotion pair' });
        }

        const discovered = progress.discoveredDyads || [];
        const availableLevel = getAvailableLevel(discovered);

        if (dyad.level > availableLevel) {
          return reply.code(403).send({
            error: 'LEVEL_LOCKED',
            message: `Unlock all ${dyad.level - 1} level dyads first`,
          });
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
      } catch (error) {
        console.error('Error in /emotion-lab/attempt:', error);
        return reply.code(500).send({
          error: 'Internal server error',
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );
}
