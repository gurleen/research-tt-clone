import { db } from "../../db/client.ts";

export const SESSION_EVENT_TABLES = [
  "evt_session_start",
  "evt_content_link_display",
  "evt_content_link_click",
  "evt_content_stub_exit",
  "evt_interest_prompt_display",
  "evt_interest_response",
  "evt_video_view",
  "evt_like",
  "evt_comments_open",
  "evt_playlist_complete",
  "evt_survey_complete",
] as const;

export type SessionEventTable = (typeof SESSION_EVENT_TABLES)[number];

export async function loadSessionEvents(
  sessionId: string,
): Promise<Record<SessionEventTable, unknown[]>> {
  const sections = {} as Record<SessionEventTable, unknown[]>;

  for (const table of SESSION_EVENT_TABLES) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .eq("session_id", sessionId);

    if (error) {
      throw new Error(`Failed to load ${table}: ${error.message}`);
    }

    sections[table] = data ?? [];
  }

  return sections;
}

export function countSessionEvents(
  events: Record<SessionEventTable, unknown[]>,
): Record<SessionEventTable, number> {
  const counts = {} as Record<SessionEventTable, number>;
  for (const table of SESSION_EVENT_TABLES) {
    counts[table] = events[table]?.length ?? 0;
  }
  return counts;
}
