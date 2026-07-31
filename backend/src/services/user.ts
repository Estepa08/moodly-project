import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { AppError, ConflictError, NotFoundError } from "../lib/errors.js";

export const CONSENT_VERSION = "1.0";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  ageConfirmed: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

function stripUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  emailVerified: boolean;
  password: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
  };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const userService = {
  async register(input: RegisterInput) {
    if (!input.ageConfirmed) {
      throw new AppError(
        "CONSENT_REQUIRED",
        400,
        "You must confirm you are 18+ and agree to data processing",
      );
    }
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("Email already registered");

    const hashed = await bcrypt.hash(input.password, 10);
    const rawToken = crypto.randomUUID();
    const tokenHash = hashToken(rawToken);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashed,
        name: input.name,
        ageConfirmed: true,
        consentAcceptedAt: new Date(),
        consentVersion: CONSENT_VERSION,
        emailVerificationToken: tokenHash,
        emailVerificationSentAt: new Date(),
      },
    });
    return { user: stripUser(user), verificationToken: rawToken };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password");

    if (!user.emailVerified) {
      throw new AppError("EMAIL_NOT_VERIFIED", 403, "Please verify your email before logging in");
    }

    return stripUser(user);
  },

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);
    const user = await prisma.user.findUnique({ where: { emailVerificationToken: tokenHash } });
    if (!user)
      throw new AppError(
        "INVALID_VERIFICATION_TOKEN",
        400,
        "Invalid or expired verification token",
      );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationSentAt: null,
      },
    });
    return stripUser(user);
  },

  async createEmailVerificationToken(userId: string): Promise<string> {
    const rawToken = crypto.randomUUID();
    const tokenHash = hashToken(rawToken);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          emailVerificationToken: tokenHash,
          emailVerificationSentAt: new Date(),
          emailVerified: false,
        },
      }),
    ]);
    return rawToken;
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User");
    return stripUser(user);
  },

  async update(id: string, data: { name?: string }) {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return stripUser(user);
  },

  async delete(id: string) {
    await prisma.user.delete({ where: { id } });
  },

  async getPreferences(userId: string) {
    const prefs = await prisma.userPreference.findUnique({ where: { userId } });
    return prefs;
  },

  async upsertPreferences(
    userId: string,
    data: {
      goals?: string[];
      experienceLevel?: string;
      dailyReminder?: boolean;
      reminderTime?: string;
      onboardingDone?: boolean;
    },
  ) {
    const prefs = await prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return prefs;
  },
};
