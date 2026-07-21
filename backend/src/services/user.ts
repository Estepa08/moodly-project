import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { AppError, ConflictError, NotFoundError } from "../lib/errors.js";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function stripUser(user: { id: string; email: string; name: string | null; createdAt: Date; password: string }) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export const userService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("Email already registered");

    const hashed = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { email: input.email, password: hashed, name: input.name },
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
    await prisma.user.delete({ where: { id } });
  },

  // DEMO-ONLY: remove before production
  async createDemo() {
    const hashed = await bcrypt.hash("demo123", 10);
    const user = await prisma.user.create({
      data: { email: `demo-${Date.now()}@moodly.local`, password: hashed, name: "Demo User" },
    });
    return stripUser(user);
  },
};
