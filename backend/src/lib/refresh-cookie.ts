import type { FastifyReply } from "fastify";

export const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 3600;

// SameSite=Lax is sufficient as long as the frontend and API share a
// registrable domain (e.g. app.example.com / api.example.com); it does not
// depend on port, so this also works for local dev (localhost:5173 -> :3001).
// Override via COOKIE_SAMESITE if the frontend is hosted on a fully
// different domain, in which case "none" also requires Secure cookies.
const SAME_SITE = (process.env.COOKIE_SAMESITE as "lax" | "strict" | "none" | undefined) ?? "lax";

export function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: SAME_SITE,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
}
