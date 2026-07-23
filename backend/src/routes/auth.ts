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
import { UnauthorizedError } from "../lib/errors.js";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  password: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>("/auth/register", async (request, reply) => {
    const { email, password, name } = request.body;
    const user = await userService.register({ email, password, name });
    const accessToken = await reply.jwtSign(
      { userId: user.id },
      { expiresIn: authService.accessTokenExpiry },
    );
    const refreshToken = await authService.createRefreshToken(user.id);
    setRefreshCookie(reply, refreshToken);
    return { accessToken, user };
  });

  fastify.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const { email, password } = request.body;
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

  fastify.post<{ Body: ForgotPasswordBody }>("/auth/forgot-password", async (request) => {
    const { email } = request.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = await authService.createResetToken(user.id);
      // In production, send email. For MVP, log the link.
      request.log.info(
        { email, resetToken: token },
        `Password reset link: /reset-password?token=${token}`,
      );
    }
    // Always return success to prevent email enumeration
    return { message: "If this email is registered, a reset link has been sent." };
  });

  fastify.post<{ Body: ResetPasswordBody }>("/auth/reset-password", async (request, reply) => {
    const { token, password } = request.body;
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

  // DEMO-ONLY: remove before production
  fastify.post("/auth/demo", async (request, reply) => {
    const user = await userService.createDemo();
    const accessToken = await reply.jwtSign(
      { userId: user.id },
      { expiresIn: authService.accessTokenExpiry },
    );
    const refreshToken = await authService.createRefreshToken(user.id);
    setRefreshCookie(reply, refreshToken);
    return { accessToken, user };
  });
}
