import type { FastifyInstance } from "fastify";
import { reportService } from "../services/report.js";

interface ReportCreateBody {
  format: "pdf" | "csv";
  periodFrom: string;
  periodTo: string;
}

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ReportCreateBody }>("/reports", { preHandler: [fastify.authenticate] }, async (request) => {
    const report = await reportService.create({ userId: request.userId, ...request.body });

    setTimeout(async () => {
      await reportService.markReady(report.id);
    }, 100);

    return report;
  });

  fastify.get("/reports", { preHandler: [fastify.authenticate] }, async (request) => {
    return reportService.list(request.userId);
  });

  fastify.get<{ Params: { id: string } }>("/reports/:id", { preHandler: [fastify.authenticate] }, async (request) => {
    return reportService.getById(request.params.id, request.userId);
  });

  fastify.get<{ Params: { id: string } }>("/reports/:id/download", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const report = await reportService.getById(request.params.id, request.userId);

    if (report.status !== "ready") {
      return reply.status(400).send({ code: "REPORT_NOT_READY", message: "Report generation is not complete" });
    }

    const entries = await reportService.getEntriesForPeriod(request.userId, report.periodFrom, report.periodTo);

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
  });

  fastify.delete<{ Params: { id: string } }>("/reports/:id", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    await reportService.delete(request.params.id, request.userId);
    reply.status(204);
  });
}
