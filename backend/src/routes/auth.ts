import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { userService } from '../services/user.js';
import { authService } from '../services/auth.js';
import {
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} from '../lib/refresh-cookie.js';
import { AppError, UnauthorizedError } from '../lib/errors.js';
import { sendEmail } from '../lib/email.js';
import { resetPasswordEmailHtml } from '../emails/reset-password-email.js';
import { welcomeEmailHtml, detectLang } from '../emails/welcome-email.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setKeysSchema,
} from '../lib/validation.js';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
    }
    const {
      email,
      password,
      name,
      ageConfirmed,
      pdpConsent,
      birthYear,
      wrappedKey,
      keySalt,
      recoveryWrappedKey,
      recoverySalt,
    } = parsed.data;
    const { user } = await userService.register({
      email,
      password,
      name,
      ageConfirmed,
      pdpConsent,
      birthYear,
      wrappedKey,
      keySalt,
      recoveryWrappedKey,
      recoverySalt,
    });
    const accessToken = await reply.jwtSign(
      { userId: user.id },
      { expiresIn: authService.accessTokenExpiry },
    );
    const refreshToken = await authService.createRefreshToken(user.id);
    setRefreshCookie(reply, refreshToken);

    const lang = detectLang(request.headers['accept-language']);
    void sendEmail({
      to: user.email,
      subject: lang === 'ru' ? 'Ваш первый день с Moodly' : 'Your first day with Moodly',
      html: welcomeEmailHtml({ name: user.name ?? '', lang }),
    }).catch((err: unknown) => {
      request.log.error({ err }, 'welcome email failed');
    });

    return { accessToken, user };
  });

  fastify.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
    }
    const { email, password } = parsed.data;
    const result = await userService.login({ email, password });
    const accessToken = await reply.jwtSign(
      { userId: result.user.id },
      { expiresIn: authService.accessTokenExpiry },
    );
    const refreshToken = await authService.createRefreshToken(result.user.id);
    setRefreshCookie(reply, refreshToken);
    return {
      accessToken,
      user: result.user,
      wrappedKey: result.wrappedKey,
      keySalt: result.keySalt,
    };
  });

  fastify.post('/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) throw new UnauthorizedError('Missing refresh token');
    const userId = await authService.consumeRefreshToken(refreshToken);
    const newAccessToken = await reply.jwtSign(
      { userId },
      { expiresIn: authService.accessTokenExpiry },
    );
    const newRefreshToken = await authService.createRefreshToken(userId);
    setRefreshCookie(reply, newRefreshToken);
    return { accessToken: newAccessToken };
  });

  fastify.post('/auth/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await authService.revokeAllUserTokens(request.userId);
    clearRefreshCookie(reply);
  });

  fastify.post('/auth/set-keys', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = setKeysSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
    }
    const result = await userService.setE2EKeys(request.userId, parsed.data);
    return reply.code(200).send(result);
  });

  fastify.post('/auth/forgot-password', async (request) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
    }
    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = await authService.createResetToken(user.id);
      void sendEmail({
        to: user.email,
        subject: 'Password Reset',
        html: resetPasswordEmailHtml({ token }),
      }).catch((err: unknown) => {
        request.log.error({ err }, 'password reset email failed');
      });
    }
    return { message: 'If this email is registered, a reset link has been sent.' };
  });

  fastify.post<{ Body: { token: string } }>('/auth/reset-info', async (request) => {
    const { token: rawToken } = request.body ?? {};
    if (typeof rawToken !== 'string' || rawToken.length === 0) {
      throw new AppError('VALIDATION_ERROR', 400, 'Token is required');
    }
    const userId = await authService.resolveResetToken(rawToken);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { recoveryWrappedKey: true, recoverySalt: true },
    });
    return {
      recoveryWrappedKey: user?.recoveryWrappedKey ?? null,
      recoverySalt: user?.recoverySalt ?? null,
    };
  });

  fastify.post('/auth/reset-password', async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
    }
    const { token, password, wrappedKey, keySalt } = parsed.data;
    const userId = await authService.consumeResetToken(token);
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, wrappedKey, keySalt },
    });
    await authService.revokeAllUserTokens(userId);
    const accessToken = await reply.jwtSign(
      { userId },
      { expiresIn: authService.accessTokenExpiry },
    );
    const refreshToken = await authService.createRefreshToken(userId);
    setRefreshCookie(reply, refreshToken);
    return { accessToken, userId, message: 'Password reset successfully' };
  });
}
