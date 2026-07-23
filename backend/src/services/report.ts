import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";

export interface ReportCreateInput {
  userId: string;
  format: "pdf" | "csv";
  periodFrom: string;
  periodTo: string;
}

export const reportService = {
  async create(input: ReportCreateInput) {
    return prisma.report.create({
      data: {
        userId: input.userId,
        format: input.format,
        status: "pending",
        periodFrom: new Date(input.periodFrom),
        periodTo: new Date(input.periodTo),
      },
    });
  },

  async list(userId: string, skip?: number, take?: number) {
    const where = { userId };
    const [data, total] = await Promise.all([
      prisma.report.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: take ?? 200 }),
      prisma.report.count({ where }),
    ]);
    return { data, total };
  },

  async getById(id: string, userId: string) {
    const report = await prisma.report.findFirst({ where: { id, userId } });
    if (!report) throw new NotFoundError("Report");
    return report;
  },

  async delete(id: string, userId: string) {
    const deleted = await prisma.report.deleteMany({ where: { id, userId } });
    if (deleted.count === 0) throw new NotFoundError("Report");
  },

  async markReady(id: string) {
    return prisma.report.update({
      where: { id },
      data: { status: "ready", downloadUrl: `/reports/${id}/download` },
    });
  },

  async markFailed(id: string) {
    await prisma.report.update({
      where: { id },
      data: { status: "failed" },
    });
  },

  async getEntriesForPeriod(userId: string, periodFrom: Date, periodTo: Date) {
    return prisma.entry.findMany({
      where: { userId, createdAt: { gte: periodFrom, lte: periodTo } },
      include: { parameter: true },
      orderBy: { createdAt: "asc" },
    });
  },

  async getTestResultsForPeriod(userId: string, periodFrom: Date, periodTo: Date) {
    return prisma.testResult.findMany({
      where: { userId, completedAt: { gte: periodFrom, lte: periodTo } },
      include: { test: true },
      orderBy: { completedAt: "desc" },
    });
  },
};
