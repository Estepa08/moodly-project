import { prisma } from "../lib/prisma.js";

export const parameterService = {
  async list() {
    return prisma.parameter.findMany({ orderBy: { name: "asc" } });
  },
};
