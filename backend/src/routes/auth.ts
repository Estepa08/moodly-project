import type { FastifyInstance, FastifyRequest } from 'fastify';
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
  parseOrThrow,
} from '../lib/validation.js';

// /auth/register и /auth/forgot-password можно utiliser для перебора email
// (существование аккаунта либо прямо раскрывается 409-конфликтом, либо
// определяется по времени/побочным эффектам письма) — сверх общего
// write-лимита по IP ограничиваем ещё и по самому email, чтобы перебор
// большого списка адресов с разных IP не проходил незамеченным.
function emailRateLimitKey(request: FastifyRequest): string {
  const email = (request.body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string' && email.length > 0
    ? `email:${email.toLowerCase()}`
    : request.ip;
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/auth/register',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour', keyGenerator: emailRateLimitKey } } },
    async (request, reply) => {
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
        referralCode,
      } = parseOrThrow(registerSchema, request.body);
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

      // Инвайт-механика (Сессия 8, three-personas-design-gaps.md): минимальное
      // отслеживание конверсии реферальной ссылки — обычный лог, без
      // серверной таблицы атрибуции. Код с лендинга (lib/referral.ts на
      // фронтенде) непрямой (хэш userId пригласившего, не сырой ID), сюда
      // приходит как есть и нигде не сверяется с реальными пользователями —
      // достаточно, чтобы по логам можно было посчитать, сколько регистраций
      // пришло с каждым конкретным кодом.
      if (referralCode) {
        request.log.info({ referralCode, newUserId: user.id }, 'referral signup');
      }
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
    },
  );

  fastify.post('/auth/login', async (request, reply) => {
    const { email, password } = parseOrThrow(loginSchema, request.body);
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
    const { userId, familyId } = await authService.consumeRefreshToken(refreshToken);
    const newAccessToken = await reply.jwtSign(
      { userId },
      { expiresIn: authService.accessTokenExpiry },
    );
    const newRefreshToken = await authService.createRefreshToken(userId, familyId);
    setRefreshCookie(reply, newRefreshToken);
    return { accessToken: newAccessToken };
  });

  fastify.post('/auth/logout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await authService.revokeAllUserTokens(request.userId);
    clearRefreshCookie(reply);
  });

  fastify.post('/auth/set-keys', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const data = parseOrThrow(setKeysSchema, request.body);
    const result = await userService.setE2EKeys(request.userId, data);
    return reply.code(200).send(result);
  });

  fastify.post(
    '/auth/forgot-password',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour', keyGenerator: emailRateLimitKey } } },
    async (request) => {
      const { email } = parseOrThrow(forgotPasswordSchema, request.body);
      const user = await userService.findByEmail(email);
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
    },
  );

  fastify.post<{ Body: { token: string } }>('/auth/reset-info', async (request) => {
    const { token: rawToken } = request.body ?? {};
    if (typeof rawToken !== 'string' || rawToken.length === 0) {
      throw new AppError('VALIDATION_ERROR', 400, 'Token is required');
    }
    const userId = await authService.resolveResetToken(rawToken);
    return userService.getRecoveryInfo(userId);
  });

  fastify.post('/auth/reset-password', async (request, reply) => {
    const { token, password, wrappedKey, keySalt } = parseOrThrow(
      resetPasswordSchema,
      request.body,
    );
    const userId = await authService.consumeResetToken(token);
    await userService.resetPassword(userId, { password, wrappedKey, keySalt });
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
