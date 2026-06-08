import type { ExportFormat } from "../../../shared/api/types.ts";
import { loadSessionForEvent } from "../events/enrich-from-session.ts";
import { loadSessionEvents } from "../sessions/session-events.ts";

export async function exportSessionData(
  sessionId: string,
  format: ExportFormat,
): Promise<Response> {
  await loadSessionForEvent(sessionId);
  const sections = await loadSessionEvents(sessionId);

  if (format === "json") {
    return Response.json({ session_id: sessionId, events: sections });
  }

  const csv = buildCsv(sessionId, sections);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="session-${sessionId}.csv"`,
    },
  });
}

function buildCsv(
  sessionId: string,
  sections: Record<string, unknown[]>,
): string {
  const lines: string[] = [`session_id,${sessionId}`, ""];

  for (const [table, rows] of Object.entries(sections)) {
    lines.push(`# ${table}`);
    if (rows.length === 0) {
      lines.push("");
      continue;
    }

    const headers = Object.keys(rows[0] as object);
    lines.push(headers.join(","));
    for (const row of rows) {
      lines.push(
        headers
          .map((key) => escapeCsv(String((row as Record<string, unknown>)[key] ?? "")))
          .join(","),
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
