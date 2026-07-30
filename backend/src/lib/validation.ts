import { z } from "zod";

export const emailSchema = z.string().email("Invalid email format").max(255);

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().max(100).optional(),
  ageConfirmed: z.boolean(),
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
