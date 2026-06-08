import { db } from "../../db/client.ts";
import type { ExportFormat } from "../../../shared/api/types.ts";
import { loadSessionForEvent } from "../events/enrich-from-session.ts";

const EVENT_TABLES = [
  "evt_session_start",
  "evt_content_link_display",
  "evt_content_link_click",
  "evt_content_stub_exit",
  "evt_interest_prompt_display",
  "evt_interest_response",
  "evt_playlist_complete",
  "evt_survey_complete",
] as const;

export async function exportSessionData(
  sessionId: string,
  format: ExportFormat,
): Promise<Response> {
  await loadSessionForEvent(sessionId);

  const sections: Record<string, unknown[]> = {};

  for (const table of EVENT_TABLES) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .eq("session_id", sessionId);

    if (error) {
      throw new Error(`Failed to export ${table}: ${error.message}`);
    }

    sections[table] = data ?? [];
  }

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
