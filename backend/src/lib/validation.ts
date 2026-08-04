import { z } from "zod";

export const emailSchema = z.string().email("Invalid email format").max(255);

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().max(100).optional(),
  ageConfirmed: z.boolean(),
  pdpConsent: z.boolean(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export const updateMeSchema = z.object({
  name: z.string().max(100).optional(),
});

export const updateEntrySchema = z.object({
  value: z.number().optional(),
  note: z.string().max(2000).optional(),
});
