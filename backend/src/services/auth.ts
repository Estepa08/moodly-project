import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_DAYS = 7;
const RESET_TOKEN_HOURS = 1;

export interface ConsumedRefreshToken {
  userId: string;
  familyId: string;
}

export const authService = {
  accessTokenExpiry: ACCESS_TOKEN_EXPIRY,

  // familyId связывает все токены одной цепочки rotation (выдан при
  // регистрации/логине → familyId не передан → новая семья; выдан при
  // /auth/refresh → familyId переносится с потребляемого токена).
  async createRefreshToken(userId: string, familyId?: string): Promise<string> {
    const rawToken = crypto.randomUUID();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 3600 * 1000);

    await prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt, familyId: familyId ?? crypto.randomUUID() },
    });
    return rawToken;
  },

  async consumeRefreshToken(rawToken: string): Promise<ConsumedRefreshToken> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored) throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Invalid refresh token');

    if (stored.revokedAt) {
      // Токен уже был обменян ранее — его повторное предъявление означает,
      // что он был украден (клиент и атакующий владеют одной и той же
      // "семьёй"). Отзываем всю семью, а не только этот токен, чтобы
      // прервать сессию угонщика вместе с легитимной.
      await prisma.refreshToken.deleteMany({ where: { familyId: stored.familyId } });
      throw new AppError('REFRESH_TOKEN_REUSED', 401, 'Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError('REFRESH_TOKEN_EXPIRED', 401, 'Refresh token expired');
    }

    // Атомарно помечаем токен использованным вместо delete: параллельный
    // запрос с тем же токеном увидит revokedAt=null уже false и получит
    // count=0 (обычная 401), а не ложно сработавший reuse-detection.
    const { count } = await prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new AppError('INVALID_REFRESH_TOKEN', 401, 'Invalid refresh token');

    return { userId: stored.userId, familyId: stored.familyId };
  },

  async revokeAllUserTokens(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async createResetToken(userId: string): Promise<string> {
    const rawToken = crypto.randomUUID();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 3600 * 1000);

    await prisma.$transaction([
      prisma.resetToken.deleteMany({ where: { userId } }),
      prisma.resetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
    return rawToken;
  },

  // Валидирует reset-токен и возвращает userId, не сжигая токен
  // (используется /auth/reset-info; consumeResetToken — только в reset-password).
  async resolveResetToken(rawToken: string): Promise<string> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.resetToken.findUnique({ where: { tokenHash } });
    if (!stored) throw new AppError('INVALID_RESET_TOKEN', 400, 'Invalid or expired reset token');
    if (stored.expiresAt < new Date()) {
      await prisma.resetToken.delete({ where: { id: stored.id } });
      throw new AppError('RESET_TOKEN_EXPIRED', 400, 'Reset token expired');
    }
    return stored.userId;
  },

  async consumeResetToken(rawToken: string): Promise<string> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.resetToken.findUnique({ where: { tokenHash } });
    if (!stored) throw new AppError('INVALID_RESET_TOKEN', 400, 'Invalid or expired reset token');
    if (stored.expiresAt < new Date()) {
      await prisma.resetToken.delete({ where: { id: stored.id } });
      throw new AppError('RESET_TOKEN_EXPIRED', 400, 'Reset token expired');
    }

    const userId = stored.userId;
    await prisma.resetToken.delete({ where: { id: stored.id } });
    return userId;
  },
};
