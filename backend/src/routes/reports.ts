import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

interface ReportCreateBody {
  format: "pdf" | "csv";
  periodFrom: string;
  periodTo: string;
}

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ReportCreateBody }>("/reports", { preHandler: [fastify.authenticate] }, async (request) => {
    const { format, periodFrom, periodTo } = request.body;

    const report = await prisma.report.create({
      data: {
        userId: request.userId,
        format,
        status: "pending",
        periodFrom: new Date(periodFrom),
        periodTo: new Date(periodTo),
      },
    });

    // Stub: generate report asynchronously, set status to "ready" and add downloadUrl
    setTimeout(async () => {
      await prisma.report.update({
        where: { id: report.id },
        data: { status: "ready", downloadUrl: `/reports/${report.id}/download` },
      });
    }, 100);

    return report;
  });

  fastify.get("/reports", { preHandler: [fastify.authenticate] }, async (request) => {
    return prisma.report.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: "desc" },
    });
  });

  fastify.get<{ Params: { id: string } }>("/reports/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    return prisma.report.findFirstOrThrow({
      where: { id: request.params.id, userId: request.userId },
    });
  });

  fastify.get<{ Params: { id: string } }>("/reports/:id/download", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const report = await prisma.report.findFirstOrThrow({
      where: { id: request.params.id, userId: request.userId },
    });

    if (report.status !== "ready") {
      return reply.status(400).send({ code: "REPORT_NOT_READY", message: "Report generation is not complete" });
    }

    const entries = await prisma.entry.findMany({
      where: { userId: request.userId, createdAt: { gte: report.periodFrom, lte: report.periodTo } },
      include: { parameter: true },
    });

    if (report.format === "csv") {
      const { stringify } = await import("csv-stringify/sync");
      const csv = stringify(
        entries.map((e) => ({
          date: e.createdAt.toISOString(),
          parameter: e.parameter.name,
          value: e.value,
          note: e.note || "",
        })),
        { header: true },
      );
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", `attachment; filename="report-${report.id}.csv"`);
      return csv;
    }

    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 40 });
    reply.header("Content-Type", "application/pdf");
    reply.header("Content-Disposition", `attachment; filename="report-${report.id}.pdf"`);

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      reply.send(Buffer.concat(chunks));
    });

    doc.fontSize(18).text("Moodly Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Period: ${report.periodFrom.toISOString().slice(0, 10)} — ${report.periodTo.toISOString().slice(0, 10)}`);
    doc.moveDown();

    for (const entry of entries) {
      doc.fontSize(11).text(`${entry.createdAt.toISOString().slice(0, 10)} | ${entry.parameter.name}: ${entry.value}${entry.parameter.unit || ""}`);
      if (entry.note) doc.fontSize(9).text(`  ${entry.note}`);
      doc.moveDown(0.3);
    }

    doc.end();
    return;
  });

  fastify.delete<{ Params: { id: string } }>("/reports/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await prisma.report.deleteMany({
      where: { id: request.params.id, userId: request.userId },
    });
    reply.status(204);
  });
}
