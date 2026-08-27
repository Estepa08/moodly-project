import { z } from 'zod';
import { AppError } from './errors.js';

// Общий паттерн во всех роутах: safeParse → если невалидно, 400 с первым
// сообщением issue. Вынесено сюда, чтобы не повторять эти 4 строки на
// каждый эндпоинт.
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 400, parsed.error.issues[0].message);
  }
  return parsed.data;
}

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
  // Инвайт-механика (Сессия 8, three-personas-design-gaps.md): только
  // логируется в /auth/register, нигде не сверяется и не хранится — см.
  // комментарий над использованием в routes/auth.ts.
  referralCode: z.string().max(64).optional(),
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
  interfaceMode: z.enum(['companion', 'classic']).optional(),
});

const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM expected');

// Режим слота напоминания: "exact" — точное время (как раньше), "window" —
// гибкое окно, сервер сам выбирает случайный момент отправки внутри границ
// (см. backend/src/jobs/reminder-scheduler.ts).
const reminderModeField = z.enum(['exact', 'window']);

export const updatePreferencesSchema = z
  .object({
    goals: z.array(z.string()).max(50).optional(),
    experienceLevel: z.string().max(50).optional(),
    dailyReminder: z.boolean().optional(),
    reminderTime: timeField.optional(),
    reminderMode: reminderModeField.optional(),
    reminderWindowStart: timeField.optional(),
    reminderWindowEnd: timeField.optional(),
    afternoonReminder: z.boolean().optional(),
    afternoonTime: timeField.optional(),
    afternoonMode: reminderModeField.optional(),
    afternoonWindowStart: timeField.optional(),
    afternoonWindowEnd: timeField.optional(),
    eveningReminder: z.boolean().optional(),
    eveningTime: timeField.optional(),
    eveningMode: reminderModeField.optional(),
    eveningWindowStart: timeField.optional(),
    eveningWindowEnd: timeField.optional(),
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

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
});
