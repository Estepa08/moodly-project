import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { userService } from "../services/user.js";
import { authService } from "../services/auth.js";
import {
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} from "../lib/refresh-cookie.js";
import { AppError, UnauthorizedError } from "../lib/errors.js";
import { sendEmail } from "../lib/email.js";
import { resetPasswordEmailHtml } from "../emails/reset-password-email.js";
import { verifyEmailHtml } from "../emails/verify-email.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../lib/validation.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400, parsed.error.issues[0].message);
    }
    const { email, password, name, ageConfirmed } = parsed.data;
    const { user, verificationToken } = await userService.register({
      email,
      password,
      name,
      ageConfirmed,
    });
    await sendEmail({
      to: user.email,
      subject: "Welcome to Moodly — Verify your email",
      html: verifyEmailHtml({ token: verificationToken }),
    });
    return { user, message: "Registration successful. Please check your email to verify your account." };
  });

  fastify.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400, parsed.error.issues[0].message);
    }
    const { email, password } = parsed.data;
    const user = await userService.login({ email, password });
    const accessToken = await reply.jwtSign(
      { userId: user.id },
      { expiresIn: authService.accessTokenExpiry },
    );
    const refreshToken = await authService.createRefreshToken(user.id);
    setRefreshCookie(reply, refreshToken);
    return { accessToken, user };
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) throw new UnauthorizedError("Missing refresh token");
    const userId = await authService.consumeRefreshToken(refreshToken);
    const newAccessToken = await reply.jwtSign(
      { userId },
      { expiresIn: authService.accessTokenExpiry },
    );
    const newRefreshToken = await authService.createRefreshToken(userId);
    setRefreshCookie(reply, newRefreshToken);
    return { accessToken: newAccessToken };
  });

  fastify.post("/auth/logout", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await authService.revokeAllUserTokens(request.userId);
    clearRefreshCookie(reply);
  });

  fastify.post("/auth/forgot-password", async (request) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400, parsed.error.issues[0].message);
    }
    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = await authService.createResetToken(user.id);
      await sendEmail({
        to: user.email,
        subject: "Password Reset",
        html: resetPasswordEmailHtml({ token }),
      });
    }
    return { message: "If this email is registered, a reset link has been sent." };
  });

  fastify.post("/auth/reset-password", async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400, parsed.error.issues[0].message);
    }
    const { token, password } = parsed.data;
    const userId = await authService.consumeResetToken(token);
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await authService.revokeAllUserTokens(userId);
    const accessToken = await reply.jwtSign(
      { userId },
      { expiresIn: authService.accessTokenExpiry },
    );
    const refreshToken = await authService.createRefreshToken(userId);
    setRefreshCookie(reply, refreshToken);
    return { accessToken, message: "Password reset successfully" };
  });

  fastify.get("/auth/verify-email", async (request, reply) => {
    const { token } = request.query as { token: string };
    if (!token) throw new AppError("VALIDATION_ERROR", 400, "Verification token is required");
    await userService.verifyEmail(token);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return reply.redirect(`${frontendUrl}/login?verified=true`);
  });

  fastify.post("/auth/send-verification-email", async (request) => {
    const { email } = request.body as { email: string };
    if (!email) throw new AppError("VALIDATION_ERROR", 400, "Email is required");
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      const token = await userService.createEmailVerificationToken(user.id);
      await sendEmail({
        to: user.email,
        subject: "Welcome to Moodly — Verify your email",
        html: verifyEmailHtml({ token }),
      });
    }
    return { message: "If this email is registered, a verification link has been sent." };
  });
}
