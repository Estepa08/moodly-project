import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { AppError, NotFoundError } from "../lib/errors.js";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_DAYS = 7;
const RESET_TOKEN_HOURS = 1;

export const authService = {
  accessTokenExpiry: ACCESS_TOKEN_EXPIRY,

  async createRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomUUID();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 3600 * 1000);

    await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
    return rawToken;
  },

  async consumeRefreshToken(rawToken: string): Promise<string> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored) throw new AppError("INVALID_REFRESH_TOKEN", 401, "Invalid refresh token");
    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError("REFRESH_TOKEN_EXPIRED", 401, "Refresh token expired");
    }

    const userId = stored.userId;
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    return userId;
  },

  async revokeAllUserTokens(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async createResetToken(userId: string): Promise<string> {
    const rawToken = crypto.randomUUID();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 3600 * 1000);

    await prisma.resetToken.create({ data: { userId, tokenHash, expiresAt } });
    return rawToken;
  },

  async consumeResetToken(rawToken: string): Promise<string> {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.resetToken.findUnique({ where: { tokenHash } });
    if (!stored) throw new AppError("INVALID_RESET_TOKEN", 400, "Invalid or expired reset token");
    if (stored.expiresAt < new Date()) {
      await prisma.resetToken.delete({ where: { id: stored.id } });
      throw new AppError("RESET_TOKEN_EXPIRED", 400, "Reset token expired");
    }

    const userId = stored.userId;
    await prisma.resetToken.delete({ where: { id: stored.id } });
    return userId;
  },
};
