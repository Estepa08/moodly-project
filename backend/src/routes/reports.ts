import type { FastifyInstance } from "fastify";
import { reportService } from "../services/report.js";
import { prisma } from "../lib/prisma.js";

interface ReportCreateBody {
  format: "pdf" | "csv";
  periodFrom: string;
  periodTo: string;
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function drawTableCell(
  doc: import("pdfkit").default,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  align: "left" | "center" | "right" = "left",
) {
  doc.fillColor("#1a1a2e").fontSize(8).text(text, x + 4, y + 4, {
    width: w - 8,
    height: h,
    align,
    ellipsis: true,
    lineBreak: false,
  });
}

function drawTableRow(
  doc: import("pdfkit").default,
  cols: { x: number; w: number }[],
  y: number,
  h: number,
  rowIndex: number,
  fillColor: string,
) {
  const totalW = cols.reduce((s, c) => s + c.w, 0);
  const firstX = cols[0].x;
  doc
    .rect(firstX, y, totalW, h)
    .fillAndStroke(fillColor, "#d0c8e0");
}

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ReportCreateBody }>(
    "/reports",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const report = await reportService.create({
        userId: request.userId,
        ...request.body,
      });
      return reportService.markReady(report.id);
    },
  );

  fastify.get("/reports", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { skip, take } = request.query as { skip?: string; take?: string };
    const result = await reportService.list(
      request.userId,
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined,
    );
    reply.header("X-Total-Count", result.total);
    return result.data;
  });

  fastify.get<{ Params: { id: string } }>(
    "/reports/:id",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return reportService.getById(request.params.id, request.userId);
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/reports/:id/download",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const report = await reportService.getById(request.params.id, request.userId);

      if (report.status !== "ready") {
        return reply
          .status(400)
          .send({ code: "REPORT_NOT_READY", message: "Report generation is not complete" });
      }

      const [entries, testResults, user] = await Promise.all([
        reportService.getEntriesForPeriod(request.userId, report.periodFrom, report.periodTo),
        reportService.getTestResultsForPeriod(request.userId, report.periodFrom, report.periodTo),
        prisma.user.findUnique({ where: { id: request.userId } }),
      ]);

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
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="report-${report.id}.pdf"`);

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        reply.send(Buffer.concat(chunks));
      });

      const locale = "en";
      const periodStr = `${formatDate(report.periodFrom, locale)} — ${formatDate(report.periodTo, locale)}`;

      doc.fontSize(18).font("Helvetica-Bold").text("Moodly Report", { align: "center" });
      doc.fontSize(9).font("Helvetica").fillColor("#64748b");
      doc.text(user?.email || "", { align: "center" });
      doc.text(periodStr, { align: "center" });
      doc.text(`Generated: ${formatDate(new Date(), locale)}`, { align: "center" });
      doc.moveDown(1.5);

      // ── Summary ──
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#4C1D95").text("Summary");
      doc.moveDown(0.3);

      const paramGroups = new Map<string, { values: number[]; unit: string | null }>();
      for (const e of entries) {
        if (!paramGroups.has(e.parameter.name)) {
          paramGroups.set(e.parameter.name, { values: [], unit: e.parameter.unit });
        }
        paramGroups.get(e.parameter.name)!.values.push(e.value);
      }

      const TEXT_PARAMS = new Set(["Gratitude", "Sleep Hygiene", "Distortion Quiz"]);
      let yPos = doc.y;
      doc.fontSize(9).font("Helvetica");
      for (const [name, group] of paramGroups) {
        if (TEXT_PARAMS.has(name)) continue;
        const avg = group.values.reduce((s, v) => s + v, 0) / group.values.length;
        const unit = group.unit || "";
        doc
          .fillColor("#1a1a2e")
          .text(`${name}: `, 40, yPos, { continued: true })
          .fillColor("#4C1D95")
          .font("Helvetica-Bold")
          .text(`${avg.toFixed(1)}${unit}`, { continued: true })
          .fillColor("#64748b")
          .font("Helvetica")
          .text(`  (${group.values.length} entries)  `, { continued: true });
        yPos = doc.y + 2;
      }
      doc.fillColor("#64748b").text(`Total entries: ${entries.length}`);
      doc.moveDown(1);

      // ── Entries table ──
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#4C1D95").text("Entries");
      doc.moveDown(0.5);

      const cols = [
        { x: 40, w: 24 },
        { x: 64, w: 78 },
        { x: 142, w: 96 },
        { x: 238, w: 52 },
        { x: 290, w: 210 },
      ];
      const rowH = 18;
      const headerH = 20;
      const headerFill = "#f0ebff";
      const evenFill = "#ffffff";
      const oddFill = "#f8f6ff";
      const tableStart = doc.y;

      // Header
      drawTableRow(doc, cols, tableStart, headerH, -1, headerFill);
      doc.fillColor("#4C1D95").font("Helvetica-Bold").fontSize(8);
      drawTableCell(doc, "#", cols[0].x, tableStart, cols[0].w, headerH, "right");
      drawTableCell(doc, "Date", cols[1].x, tableStart, cols[1].w, headerH);
      drawTableCell(doc, "Parameter", cols[2].x, tableStart, cols[2].w, headerH);
      drawTableCell(doc, "Value", cols[3].x, tableStart, cols[3].w, headerH);
      drawTableCell(doc, "Note", cols[4].x, tableStart, cols[4].w, headerH);

      // Rows
      doc.font("Helvetica").fillColor("#1a1a2e");
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const rowY = tableStart + headerH + i * rowH;
        const fill = i % 2 === 0 ? evenFill : oddFill;
        drawTableRow(doc, cols, rowY, rowH, i, fill);

        const dateStr = formatDate(e.createdAt, locale);
        const valStr = `${e.value}${e.parameter.unit || ""}`;

        drawTableCell(doc, String(i + 1), cols[0].x, rowY, cols[0].w, rowH, "right");
        drawTableCell(doc, dateStr, cols[1].x, rowY, cols[1].w, rowH);
        drawTableCell(doc, e.parameter.name, cols[2].x, rowY, cols[2].w, rowH);
        drawTableCell(doc, valStr, cols[3].x, rowY, cols[3].w, rowH, "center");
        drawTableCell(doc, e.note || "", cols[4].x, rowY, cols[4].w, rowH);
      }

      doc.y = tableStart + headerH + entries.length * rowH + 20;

      // ── Test Results ──
      const latestByTest = new Map<
        string,
        (typeof testResults)[number]
      >();
      for (const tr of testResults) {
        if (!latestByTest.has(tr.testId)) {
          latestByTest.set(tr.testId, tr);
        }
      }

      if (latestByTest.size > 0) {
        doc.fontSize(13).font("Helvetica-Bold").fillColor("#4C1D95").text("Test Results");
        doc.moveDown(0.3);

        doc.fontSize(9).font("Helvetica").fillColor("#1a1a2e");
        for (const tr of latestByTest.values()) {
          const testDate = formatDate(tr.completedAt, locale);
          doc
            .fillColor("#1a1a2e")
            .font("Helvetica-Bold")
            .text(`${tr.test.title} — ${testDate}`);
          doc
            .font("Helvetica")
            .fillColor("#64748b")
            .text(`Score: ${tr.score} — ${tr.interpretation}`);
          doc.moveDown(0.3);
        }
      }

      doc.end();
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/reports/:id",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      await reportService.delete(request.params.id, request.userId);
      reply.status(204);
    },
  );
}
