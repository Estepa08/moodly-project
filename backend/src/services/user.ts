import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError, ConflictError, NotFoundError } from "../lib/errors.js";

export const CONSENT_VERSION = "2.0";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  ageConfirmed: boolean;
  pdpConsent: boolean;
  birthYear?: number;
  wrappedKey: string;
  keySalt: string;
  recoveryWrappedKey: string;
  recoverySalt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SetKeysInput {
  wrappedKey: string;
  keySalt: string;
  recoveryWrappedKey: string;
  recoverySalt: string;
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

export const userService = {
  async register(input: RegisterInput) {
    if (!input.ageConfirmed) {
      throw new AppError("CONSENT_REQUIRED", 400, "You must confirm you are 18+");
    }
    if (!input.pdpConsent) {
      throw new AppError(
        "PDP_CONSENT_REQUIRED",
        400,
        "Consent to personal data processing is required",
      );
    }
    if (input.birthYear != null && new Date().getFullYear() - input.birthYear < 18) {
      throw new AppError("AGE_REQUIRED", 400, "You must be at least 18 years old");
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
        pdpConsent: true,
        birthYear: input.birthYear ?? null,
        consentAcceptedAt: new Date(),
        consentVersion: CONSENT_VERSION,
        emailVerified: true,
        wrappedKey: input.wrappedKey,
        keySalt: input.keySalt,
        recoveryWrappedKey: input.recoveryWrappedKey,
        recoverySalt: input.recoverySalt,
      },
    });
    return { user: stripUser(user) };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) throw new AppError("INVALID_CREDENTIALS", 401, "Invalid email or password");

    return {
      user: stripUser(user),
      wrappedKey: user.wrappedKey,
      keySalt: user.keySalt,
    };
  },

  // Миграция legacy-учёток (созданных до E2E-шифрования): задаём E2E-ключи,
  // только если их ещё нет. Предотвращает перезапись существующих ключей.
  async setE2EKeys(userId: string, input: SetKeysInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User");
    if (user.wrappedKey) {
      throw new AppError("KEYS_ALREADY_SET", 409, "Encryption keys already configured");
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        wrappedKey: input.wrappedKey,
        keySalt: input.keySalt,
        recoveryWrappedKey: input.recoveryWrappedKey,
        recoverySalt: input.recoverySalt,
      },
    });
    return { ok: true as const };
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User");
    return stripUser(user);
  },

  async update(id: string, data: { name?: string }) {
    const sanitized: { name?: string } = {};
    if (data?.name !== undefined) sanitized.name = data.name;
    const user = await prisma.user.update({
      where: { id },
      data: sanitized,
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
