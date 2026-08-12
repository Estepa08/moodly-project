import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email format').max(255);

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);

// E2E-ключи: base64-строки без ограничения в 64 КБ (wrappedKey ~ 32 байта + IV).
const keyField = z.string().min(1).max(65536);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().max(100).optional(),
  ageConfirmed: z.boolean(),
  pdpConsent: z.boolean(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  wrappedKey: keyField,
  keySalt: keyField,
  recoveryWrappedKey: keyField,
  recoverySalt: keyField,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  wrappedKey: keyField,
  keySalt: keyField,
});

export const setKeysSchema = z.object({
  wrappedKey: keyField,
  keySalt: keyField,
  recoveryWrappedKey: keyField,
  recoverySalt: keyField,
});

export const updateMeSchema = z.object({
  name: z.string().max(100).optional(),
});

const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM expected');

export const updatePreferencesSchema = z
  .object({
    goals: z.array(z.string()).max(50).optional(),
    experienceLevel: z.string().max(50).optional(),
    dailyReminder: z.boolean().optional(),
    reminderTime: timeField.optional(),
    afternoonReminder: z.boolean().optional(),
    afternoonTime: timeField.optional(),
    eveningReminder: z.boolean().optional(),
    eveningTime: timeField.optional(),
    onboardingDone: z.boolean().optional(),
    showSupportResources: z.boolean().optional(),
  })
  .strict();

export const updateEntrySchema = z.object({
  encryptedData: z.string().min(1).max(65536),
});

export const createEntrySchema = z.object({
  id: z.string().min(8).max(80),
  parameterId: z.string().min(1).max(100),
  encryptedData: z.string().min(1).max(65536),
});
