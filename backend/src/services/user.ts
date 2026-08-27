import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { AppError, ConflictError, NotFoundError } from '../lib/errors.js';

export const CONSENT_VERSION = '2.0';

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
  interfaceMode: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
    interfaceMode: user.interfaceMode,
  };
}

// Брутфорс-защита на уровне аккаунта: общий write-rate-limit (index.ts)
// бьёт по IP и не спасает от credential stuffing, распределённого по
// множеству IP — поэтому считаем неудачные попытки на самом аккаунте.
const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

export const userService = {
  async register(input: RegisterInput) {
    if (!input.ageConfirmed) {
      throw new AppError('CONSENT_REQUIRED', 400, 'You must confirm you are 18+');
    }
    if (!input.pdpConsent) {
      throw new AppError(
        'PDP_CONSENT_REQUIRED',
        400,
        'Consent to personal data processing is required',
      );
    }
    if (input.birthYear != null && new Date().getFullYear() - input.birthYear < 18) {
      throw new AppError('AGE_REQUIRED', 400, 'You must be at least 18 years old');
    }
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email already registered');

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
    if (!user) throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('ACCOUNT_LOCKED', 429, 'Too many failed login attempts. Try again later.');
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockingOut = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: lockingOut ? 0 : attempts,
          lockedUntil: lockingOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
        },
      });
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

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
    if (!user) throw new NotFoundError('User');
    if (user.wrappedKey) {
      throw new AppError('KEYS_ALREADY_SET', 409, 'Encryption keys already configured');
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
    if (!user) throw new NotFoundError('User');
    return stripUser(user);
  },

  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? stripUser(user) : null;
  },

  async getRecoveryInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { recoveryWrappedKey: true, recoverySalt: true },
    });
    return {
      recoveryWrappedKey: user?.recoveryWrappedKey ?? null,
      recoverySalt: user?.recoverySalt ?? null,
    };
  },

  // Сбрасывает пароль и E2E-ключи по валидному reset-токену; заодно снимает
  // брутфорс-блокировку логина (см. login) — новый пароль не должен
  // оставаться заблокированным по счётчику от старого.
  async resetPassword(
    userId: string,
    input: { password: string; wrappedKey: string; keySalt: string },
  ) {
    const hashed = await bcrypt.hash(input.password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        wrappedKey: input.wrappedKey,
        keySalt: input.keySalt,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  },

  async update(id: string, data: { name?: string; interfaceMode?: string }) {
    // Явный whitelist полей: этот роут не должен пропускать role/email/password
    // и т.п. — даже если позже кто-то расширит вызывающий тип.
    const sanitized: { name?: string; interfaceMode?: string } = {};
    if (data?.name !== undefined) sanitized.name = data.name;
    if (data?.interfaceMode !== undefined) sanitized.interfaceMode = data.interfaceMode;
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
      reminderMode?: string;
      reminderWindowStart?: string;
      reminderWindowEnd?: string;
      afternoonReminder?: boolean;
      afternoonTime?: string;
      afternoonMode?: string;
      afternoonWindowStart?: string;
      afternoonWindowEnd?: string;
      eveningReminder?: boolean;
      eveningTime?: string;
      eveningMode?: string;
      eveningWindowStart?: string;
      eveningWindowEnd?: string;
      onboardingDone?: boolean;
      showSupportResources?: boolean;
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
