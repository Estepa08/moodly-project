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
  createdAt: Date;
  password: string;
}) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export const userService = {
  async register(input: RegisterInput) {
    if (!input.ageConfirmed) {
      throw new AppError("CONSENT_REQUIRED", 400, "You must confirm you are 18+ and agree to data processing");
    }
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("Email already registered");

    const hashed = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashed,
        name: input.name,
        ageConfirmed: true,
        consentAcceptedAt: new Date(),
        consentVersion: CONSENT_VERSION,
      },
    });
    return stripUser(user);
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password");

    return stripUser(user);
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
    await prisma.$transaction([
      prisma.breathingSession.deleteMany({ where: { userId: id } }),
      prisma.creatureState.deleteMany({ where: { userId: id } }),
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.resetToken.deleteMany({ where: { userId: id } }),
      prisma.testResult.deleteMany({ where: { userId: id } }),
      prisma.report.deleteMany({ where: { userId: id } }),
      prisma.feedback.deleteMany({ where: { userId: id } }),
      prisma.entry.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
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

  // DEMO-ONLY: remove before production
  async createDemo() {
    const existing = await prisma.user.findFirst({
      where: { email: "demo@moodly.app" },
    });
    if (existing) return stripUser(existing);

    const hashed = await bcrypt.hash("demo123", 10);
    const user = await prisma.user.create({
      data: { email: "demo@moodly.app", password: hashed, name: "Demo User" },
    });
    return stripUser(user);
  },
};
